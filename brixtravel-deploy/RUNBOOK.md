# Brixtravel — Runbook لإعادة التشغيل على Contabo

نقل brixtravel.com من Hostinger المنتهي إلى Contabo VPS، بدون أي مساس بـ Wapy أو Mohammad Ledger.

> كل الأوامر تُنفّذ من ماك حضرتك. أي شي بعد `# on server` ينفّذ داخل جلسة SSH على Contabo.

---

## ⚠️ تحقّق قبل البداية — Public IP متضارب

| المصدر | قيمة |
|---|---|
| `data.js` (تاريخي) | `62.171.128.44` |
| جلسة الترحيل الحالية | `46.202.172.151` |
| Tailscale (مؤكد عبر runtime-sync) | `100.116.69.101` |
| Hostname (SSH-verified) | `vmi3061403` |

السيرفر **واحد فقط** (نفس Tailscale IP + نفس hostname لجميع المراجع). Public IP غيّره Contabo على الأغلب. قبل أي A record على Cloudflare، تحقّق:

```bash
# من ماكك (يستخدم ssh config المحلي على ~/.ssh/config)
ssh contabo 'curl -s -4 ifconfig.me; echo'
# أو عبر Tailscale المضمون:
ssh argaz@100.116.69.101 'curl -s -4 ifconfig.me; echo'
```

استخدم القيمة اللي يرجعها السيرفر نفسه. كل ذكر لاحق لـ `46.202.172.151` في هذا الملف **استبدله بالقيمة الحقيقية**.

---

## 0. تجهيزة محلية على الماك

```bash
# اسحب الملفات من iCloud إلى تخزين محلي (لأن scp يفشل أحياناً مع placeholders)
brctl download "/Users/rabeeshaban/Desktop/Projects/🌐 brixtravelwebsite/"
ls -la "/Users/rabeeshaban/Desktop/Projects/🌐 brixtravelwebsite/" | head

# تأكد من وجود المفتاح
ls -l ~/.ssh/contabo_key
```

## 1. إصلاح وصول SSH (إن لزم)

جرّب الاتصال:

```bash
ssh -i ~/.ssh/contabo_key -p 65002 argaz@46.202.172.151
```

لو فشل بـ `Permission denied (publickey)`، المفتاح العام غير مضاف على السيرفر. الحلول:

- **أ) عبر Contabo Web Console** (لو ما عندك كلمة سر argaz): سجّل دخول إلى لوحة Contabo → VPS Control → افتح VNC/Web console → سجّل دخول كـ root → ثم:
  ```bash
  sudo -u argaz mkdir -p /home/argaz/.ssh
  sudo -u argaz tee -a /home/argaz/.ssh/authorized_keys <<'EOF'
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHv1h45V264CpU4uMBAi+VflvPF38PVQfMQa2yHadu7a rabeeshaban@RABEEs-MacBook-Pro-2.local
  EOF
  sudo chmod 700 /home/argaz/.ssh
  sudo chmod 600 /home/argaz/.ssh/authorized_keys
  sudo chown -R argaz:argaz /home/argaz/.ssh
  ```

- **ب) عبر Tailscale** (لو argaz عنده مفتاح Tailscale آخر فعّال):
  ```bash
  ssh argaz@100.116.69.101
  # ثم نفس الخطوات أعلاه على authorized_keys
  ```

تأكيد:

```bash
ssh -i ~/.ssh/contabo_key -p 65002 argaz@46.202.172.151 'echo ok && hostname'
```

## 2. فحص موارد السيرفر

```bash
ssh -i ~/.ssh/contabo_key -p 65002 argaz@46.202.172.151 << 'EOF'
echo "=== Disk ==="; df -h / /opt
echo "=== RAM ==="; free -h
echo "=== Docker ==="; docker --version && docker compose version
echo "=== Existing 80/443 ==="; sudo ss -lntp | grep -E ':80 |:443 ' || echo "free"
echo "=== Wapy still up? ==="; docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -i wapy
echo "=== Mohammad Ledger still up? ==="; systemctl --user --machine=argaz@ status mohammad-ledger-bot --no-pager 2>/dev/null || systemctl status mohammad-ledger-bot --no-pager 2>/dev/null | head -5
EOF
```

**شرط المتابعة:** المنافذ 80/443 حرّة (Wapy على Tailscale only). لو محجوزة → توقّف وراجع.

## 3. تجهيز مجلد المشروع على السيرفر

```bash
ssh -i ~/.ssh/contabo_key -p 65002 argaz@46.202.172.151 << 'EOF'
sudo mkdir -p /opt/brixtravel
sudo chown argaz:argaz /opt/brixtravel
mkdir -p /opt/brixtravel/wp-content-import
EOF
```

## 4. رفع ملفات الـ stack

من ماكك، داخل ريبو command-center بعد `git pull`:

```bash
cd ~/path/to/command-center
git checkout claude/restart-brixtravel-server-5ju7a
git pull

scp -i ~/.ssh/contabo_key -P 65002 \
  brixtravel-deploy/docker-compose.yml \
  brixtravel-deploy/Caddyfile \
  brixtravel-deploy/.env.example \
  brixtravel-deploy/backup.sh \
  argaz@46.202.172.151:/opt/brixtravel/
```

ثم على السيرفر:

```bash
ssh -i ~/.ssh/contabo_key -p 65002 argaz@46.202.172.151 << 'EOF'
cd /opt/brixtravel
cp .env.example .env
# عدّل كلمات السر — استخدم قيم قوية
sed -i "s|CHANGE_ME_strong_password|$(openssl rand -base64 24 | tr -d '=+/')|" .env
sed -i "s|CHANGE_ME_strong_root_password|$(openssl rand -base64 24 | tr -d '=+/')|" .env
chmod 600 .env
chmod +x backup.sh
cat .env
EOF
```

**احفظ مخرجات `cat .env` في مكان آمن (1Password).**

## 5. رفع ملفات WordPress المحلية

```bash
# من الماك — كل محتوى المجلد المحلي
rsync -avz --progress -e "ssh -i ~/.ssh/contabo_key -p 65002" \
  "/Users/rabeeshaban/Desktop/Projects/🌐 brixtravelwebsite/" \
  argaz@46.202.172.151:/opt/brixtravel/wp-content-import/
```

## 6. تشغيل الـ stack (WordPress فاضي أولاً)

```bash
ssh -i ~/.ssh/contabo_key -p 65002 argaz@46.202.172.151 << 'EOF'
cd /opt/brixtravel
docker compose pull
docker compose up -d
sleep 20
docker compose ps
docker compose logs --tail=30 wordpress
EOF
```

> **قبل المرور بنقاط 7 و8، أوقف Cloudflare DNS:** اجعل الـ A records لـ brixtravel.com و www تشير إلى IP Contabo لكن **اضغط على السحابة لتصير رمادية (DNS only)** بشكل مؤقت. هذا ضروري كي يستطيع Caddy إصدار شهادة Let's Encrypt عبر HTTP-01. بعد نجاح الشهادة أعد تفعيل البرتقالي.

## 7. تحديث Cloudflare DNS

من لوحة Cloudflare → brixtravel.com → DNS:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `46.202.172.151` | 🟠 DNS only (مؤقتاً) |
| A | `www` | `46.202.172.151` | 🟠 DNS only (مؤقتاً) |

احذف أي A records قديمة تشير إلى Hostinger.

**لا تلمس MX records** (البريد ما زال على Hostinger).

انتظر 2-5 دقائق ثم تحقق:

```bash
dig +short www.brixtravel.com
# يجب أن يعطي 46.202.172.151
```

## 8. استيراد محتوى WordPress

نسختان حسب الحالة:

### 8.أ — لديك Backup SQL قديم

```bash
ssh -i ~/.ssh/contabo_key -p 65002 argaz@46.202.172.151 << 'EOF'
cd /opt/brixtravel
# انسخ ملفات wp-content من الاستيراد إلى حاوية WP
docker cp wp-content-import/wp-content/. brixtravel-wp:/var/www/html/wp-content/
docker exec brixtravel-wp chown -R www-data:www-data /var/www/html/wp-content

# استورد قاعدة البيانات (ضع ملف .sql في /opt/brixtravel/import.sql أولاً)
# docker exec -i brixtravel-db mariadb -u root -p"$(grep WP_DB_ROOT_PASSWORD .env | cut -d= -f2)" "$(grep WP_DB_NAME .env | cut -d= -f2)" < import.sql

# search-replace للروابط القديمة (لو الـ backup من نطاق غير brixtravel.com)
# docker exec brixtravel-wp wp --allow-root search-replace 'https://old-domain' 'https://www.brixtravel.com'
EOF
```

### 8.ب — لا backup، نبدأ نظيف

افتح `https://www.brixtravel.com/wp-admin/install.php` وأكمل الإعداد. ثم ارفع `wp-content/uploads` و `wp-content/themes` يدوياً من المجلد المستورد:

```bash
ssh -i ~/.ssh/contabo_key -p 65002 argaz@46.202.172.151 << 'EOF'
docker cp /opt/brixtravel/wp-content-import/wp-content/uploads/. brixtravel-wp:/var/www/html/wp-content/uploads/
docker cp /opt/brixtravel/wp-content-import/wp-content/themes/. brixtravel-wp:/var/www/html/wp-content/themes/
docker exec brixtravel-wp chown -R www-data:www-data /var/www/html/wp-content
EOF
```

## 9. اختبار

```bash
curl -I https://www.brixtravel.com
# توقّع: HTTP/2 200
curl -sI https://brixtravel.com | head -1
# توقّع: 301 → https://www.brixtravel.com
```

افتح المتصفح وتحقق من:
- الصفحة الرئيسية تطلع
- `/wp-admin` يطلب تسجيل دخول
- الصور تظهر (لو لأ — تحقق من الـ uploads)

## 10. أعد تفعيل Cloudflare Proxy

من Cloudflare DNS → اضغط السحابة لتعود برتقالية (Proxied) للسجلات الاثنين.

ثم **SSL/TLS → Overview → Full (strict)** (الآن يصح لأن شهادة Let's Encrypt الحقيقية موجودة على السيرفر).

تحقق نهائي:

```bash
curl -sI https://www.brixtravel.com | head -5
```

## 11. النسخ الاحتياطي اليومي

```bash
ssh -i ~/.ssh/contabo_key -p 65002 argaz@46.202.172.151 << 'EOF'
# اختبر يدوياً مرة
sudo /opt/brixtravel/backup.sh
ls -lh /opt/brixtravel/backups/

# جدوله
(sudo crontab -l 2>/dev/null; echo "30 3 * * * /opt/brixtravel/backup.sh >> /var/log/brixtravel-backup.log 2>&1") | sudo crontab -
sudo crontab -l
EOF
```

## 12. تحديث Command Center

بعد نجاح كل ما سبق، حدّث الحقول التالية في `data.js` ضمن مدخل Brixtravel:
- `current_status.updated` = اليوم
- `current_status.where` = "حي على Contabo، Caddy SSL، نسخ يومي 03:30"
- في `data.runtime.json` اليدوي (إن لزم): `brixtravel` → `ok`

---

## استكشاف أخطاء سريع

| الأعراض | الفحص | الإصلاح |
|---|---|---|
| Caddy لا يصدر شهادة | `docker logs brixtravel-caddy` | تأكد أن Cloudflare على DNS only، والمنفذ 80 يصل من الإنترنت |
| WP يعيد 500 | `docker logs brixtravel-wp` | تحقق من `WP_HOME` وأن قاعدة البيانات شغّالة |
| Mixed content | DevTools → Console | تأكد من `FORCE_SSL_ADMIN` وأن `X-Forwarded-Proto` يمر |
| 502 من Caddy | `docker compose ps` | تأكد أن wordpress container صحي |
| Wapy تعطّل | `docker ps \| grep wapy` | brixtravel على شبكة منفصلة — لا يجب أن يلمسه |

## نقاط أمان

- المنافذ 80/443 الآن مفتوحة للإنترنت (سابقاً Tailscale-only فقط). تأكد من UFW يسمح بهذين فقط
- `.env` صلاحياته 600
- لا تكشف `/wp-login.php` على الإنترنت بدون 2FA — أضف plugin مثل WPS Hide Login أو فعّل Cloudflare Access لاحقاً
- البريد @brixtravel.com **لم يُمَس** — يبقى على Hostinger MX
