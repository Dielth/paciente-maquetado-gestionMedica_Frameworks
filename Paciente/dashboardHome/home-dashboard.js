// home-dashboard.js
(function(){

  /* ── Utilidades ── */
  function byId(id){ return document.getElementById(id); }

  function toast(msg){
    var t=byId('toast');
    t.textContent=msg;
    t.classList.add('show');
    setTimeout(function(){ t.classList.remove('show'); },3000);
  }

  /* ── Navegación ── */
  byId('btnArchives').addEventListener('click',function(){ window.location.href=''; });
  byId('btnProfile').addEventListener('click',function(){ window.location.href=''; });
  byId('btnLogout').addEventListener('click',function(){ window.location.href=''; });

  /* ════════════════════════════════════════
     MINI CALENDAR (columna derecha, estado por defecto)
     Renderiza semanas del mes actual.
  ════════════════════════════════════════ */
  (function buildMiniCal(){
    var today  = new Date();
    var y = today.getFullYear(), m = today.getMonth();
    var firstDow = new Date(y,m,1).getDay();
    var offset   = (firstDow===0) ? 6 : firstDow-1;   // lunes = 0
    var total    = new Date(y,m+1,0).getDate();
    var tbody    = byId('miniCalBody');
    tbody.innerHTML='';
    var day=1;
    for(var w=0;w<5;w++){
      if(day>total) break;
      var tr=document.createElement('tr');
      for(var c=0;c<7;c++){
        var td=document.createElement('td');
        var idx=w*7+c;
        if(idx<offset||day>total){
          td.textContent='';
          td.style.cssText='background:transparent;border:none';
        } else {
          td.textContent=day;
          if(day===today.getDate()) td.classList.add('today');
          day++;
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  })();

  /* ════════════════════════════════════════
     SCHEDULE PANEL
     Lógica portada 1:1 de profile-dashboard.html
  ════════════════════════════════════════ */
  var MES = ['January','February','March','April','May','June',
             'July','August','September','October','November','December'];
  var MES_ES=['enero','febrero','marzo','abril','mayo','junio',
              'julio','agosto','septiembre','octubre','noviembre','diciembre'];

  var today   = new Date();
  var calY    = today.getFullYear();
  var calM    = today.getMonth();
  var picked  = null;
  var selDoc  = null;

  /* ── Construir calendario ── */
  function buildCal(){
    byId('calMonthLbl').textContent = MES[calM]+' '+calY;
    var tbody = byId('calBody');
    tbody.innerHTML='';
    var total   = new Date(calY,calM+1,0).getDate();
    var firstDow= new Date(calY,calM,1).getDay();
    var off     = (firstDow===0) ? 6 : firstDow-1;  // semana empieza en lunes

    for(var w=0;w<6;w++){
      var rowStart = w*7-off+1;
      if(rowStart>total) break;
      var tr=document.createElement('tr');
      for(var c=0;c<7;c++){
        var dn=rowStart+c;
        var td=document.createElement('td');
        if(dn<1||dn>total){
          td.className='emp'; td.textContent='';
        } else {
          td.textContent=dn;
          /* días de semana → "disponibles" (visual has) */
          var dow=new Date(calY,calM,dn).getDay();
          if(dow!==0&&dow!==6) td.classList.add('has');
          /* hoy */
          if(dn===today.getDate()&&calM===today.getMonth()&&calY===today.getFullYear())
            td.classList.add('today-cell');
          /* seleccionado */
          if(picked&&dn===picked.d&&calM===picked.m&&calY===picked.y)
            td.classList.add('picked');
          /* click */
          (function(day,cell){
            cell.addEventListener('click',function(){
              if(cell.classList.contains('emp')) return;
              /* quitar picked anterior */
              [].slice.call(byId('calBody').querySelectorAll('td'))
                .forEach(function(t){ t.classList.remove('picked'); });
              cell.classList.add('picked');
              picked={d:day,m:calM,y:calY};
              /* actualizar resumen */
              byId('sumDate').textContent=
                day+' de '+MES_ES[calM]+' de '+calY;
              /* mostrar resumen si ya hay doctor seleccionado */
              checkSummary();
            });
          })(dn,td);
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  byId('calPrev').addEventListener('click',function(){
    calM--; if(calM<0){calM=11;calY--;} buildCal();
  });
  byId('calNext').addEventListener('click',function(){
    calM++; if(calM>11){calM=0;calY++;} buildCal();
  });

  /* ── Búsqueda de doctor ── */
  byId('docSearch').addEventListener('input',function(){
    var q=this.value.toLowerCase();
    [].slice.call(byId('docList').querySelectorAll('.doc-item'))
      .forEach(function(d){
        d.style.display=d.textContent.toLowerCase().includes(q)?'':'none';
      });
  });

  /* ── Selección de doctor ── */
  [].slice.call(byId('docList').querySelectorAll('.doc-item')).forEach(function(el){
    el.addEventListener('click',function(){
      [].slice.call(byId('docList').querySelectorAll('.doc-item'))
        .forEach(function(d){ d.classList.remove('sel'); });
      el.classList.add('sel');
      selDoc=el.textContent.trim();
      byId('sumDoc').textContent=selDoc;
      checkSummary();
    });
  });

  /* ── Mostrar resumen cuando hay doctor + fecha ── */
  function checkSummary(){
    if(!selDoc||!picked) return;
    /* pasar a estado 2 */
    byId('schedLeft').style.display='none';
    byId('schedSummary').classList.add('show');
    byId('btnConfirmAppt').classList.add('show');
  }

  /* ── Abrir / cerrar panel ── */
  function openSched(){
    /* Resetear estado */
    picked=null; selDoc=null;
    byId('schedLeft').style.display='';
    byId('schedSummary').classList.remove('show');
    byId('btnConfirmAppt').classList.remove('show');
    /* Restaurar selección por defecto del primer doctor */
    var first=byId('docList').querySelector('.doc-item');
    if(first) first.classList.add('sel');
    /* Ocultar mini-cal, mostrar panel */
    byId('miniCalWrap').style.display='none';
    byId('schedPanel').classList.add('open');
    buildCal();
  }

  function closeSched(){
    byId('schedPanel').classList.remove('open');
    byId('miniCalWrap').style.display='';
  }

  byId('btnSched').addEventListener('click', openSched);
  byId('btnSchedClose').addEventListener('click', closeSched);

  /* ── Confirmar cita ── */
  byId('btnConfirmAppt').addEventListener('click',function(){
    var hh=(byId('hourH').value||'16').toString().padStart(2,'0');
    var mm=(byId('hourM').value||'00').toString().padStart(2,'0');
    var dateStr=byId('sumDate').textContent;
    var docStr=byId('sumDoc').textContent;
    /* TODO: POST /api/appointments { patientId, doctorId, date, hour } */
    closeSched();
    toast('✅ Appointment confirmed · '+docStr+' · '+dateStr+' '+hh+':'+mm);
  });

})();