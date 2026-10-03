const SurveyModel = (() => {
  const departments = Object.freeze({ 'brix-b2b':{parent:'brix',projects:[]}, easybooking:{parent:'brix',projects:['easybooking']}, rihlaty:{parent:'brix',projects:['rihlaty-travel']} });
  const digits = value => String(value || '').replace(/[\u0660-\u0669\u06f0-\u06f9]/g,c=>String(c.charCodeAt(0)%16));
  function member(data, uniqueId) {
    const department = departments[data.department];
    if(!department || !data.name?.trim() || !data.phone?.trim() || !data.role?.trim()) throw new Error('أكمل الاسم والهاتف والقسم والدور.');
    if(!uniqueId) throw new Error('تعذر إنشاء معرّف للعضو.');
    const name = data.name.trim();
    const phone = digits(data.phone).replace(/[^+\d]/g,'');
    if(!/^\+?\d{7,15}$/.test(phone)) throw new Error('راجع رقم الهاتف ورمز الدولة.');
    const optional = Object.fromEntries(['name_en','full_name','nationality','whatsapp_display_name','email_work','telegram','location_office','manager','hire_date','contract_type','working_hours'].map(key=>[key,data[key]?.trim() || null]));
    return {id:`member-${uniqueId}`,name,...optional,languages:data.languages || [],phone,phone_local:phone.replace(/^\+/,'00'),whatsapp:digits(data.whatsapp || phone).replace(/\D/g,''),department:data.department,parent:department.parent,role:data.role.trim(),assigned_projects:[...department.projects],salary_usd:null,status:'active'};
  }
  return Object.freeze({departments,member});
})();
if(typeof module !== 'undefined') module.exports = SurveyModel;
