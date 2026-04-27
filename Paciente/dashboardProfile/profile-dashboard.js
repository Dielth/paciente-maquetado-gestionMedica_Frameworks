(function(){

  function byId(id){ return document.getElementById(id); }

  function toast(msg){
    var t=byId('toast');
    t.textContent=msg;
    t.classList.add('show');
    setTimeout(function(){ t.classList.remove('show'); },3000);
  }

  /* ── NAV ── */
  byId('btnHome').addEventListener('click',function(){ window.location.href='../dashboardHome/index.html'; });
  byId('btnArchives').addEventListener('click',function(){ window.location.href='../dashboardArchives/archives-dashboard.html'; });
  byId('btnLogout').addEventListener('click',function(){ window.location.href=''; });

  /* ── SECTION SWITCHING ── */
  var PAGE_TITLES={home:'My profile',medinfo:'My medical information',
                   medication:'My profile',progress:'Progress Notes'};

  var slinks=[].slice.call(document.querySelectorAll('.s-link'));
  slinks.forEach(function(btn){
    btn.addEventListener('click',function(){
      var sec=btn.getAttribute('data-sec');
      var target=byId('sec-'+sec);
      if(!target) return;
      [].slice.call(document.querySelectorAll('.sec')).forEach(function(s){ s.classList.remove('active'); });
      slinks.forEach(function(b){ b.classList.remove('active'); });
      target.classList.add('active');
      btn.classList.add('active');
      byId('pageTitle').textContent=PAGE_TITLES[sec]||'My profile';

      if(sec==='home'){
        byId('piCard').style.display='block';
        byId('editPanel').classList.remove('open');
        byId('schedPanel').classList.remove('open');
        byId('schedWrapWelcome').style.display='none';
      }
    });
  });

  /* ── PRESCRIPTION TOGGLE ── */
  [].slice.call(document.querySelectorAll('.rx-list-item')).forEach(function(item){
    item.addEventListener('click',function(){
      var targetId=item.getAttribute('data-target');
      var detail=byId(targetId);
      if(!detail) return;
      var isOpen=detail.classList.contains('open');
      [].slice.call(document.querySelectorAll('.rx-detail')).forEach(function(d){ d.classList.remove('open'); });
      [].slice.call(document.querySelectorAll('.rx-list-item')).forEach(function(i){ i.classList.remove('open'); });
      if(!isOpen){
        detail.classList.add('open');
        item.classList.add('open');
      }
    });
  });

  /* ── BELL ── */
  byId('bellBtn').addEventListener('click',function(e){
    e.stopPropagation();
    var card=byId('notifCard');
    card.classList.toggle('open');
    if(card.classList.contains('open')) byId('bellDot').style.display='none';
  });
  document.addEventListener('click',function(){
    var card=byId('notifCard');
    if(card) card.classList.remove('open');
  });

  /* ── EDIT INFO ── */
  byId('btnEditInfo').addEventListener('click',function(){
    byId('piCard').style.display='none';
    byId('editPanel').classList.add('open');
  });

  byId('btnSaveInfo').addEventListener('click',function(){
    var n=byId('editName').value.trim();
    var l=byId('editLastname').value.trim();
    var e=byId('editEmail').value.trim();
    var p=byId('editPhone').value.trim();
    byId('piName').textContent=n||'—';
    byId('piLastname').textContent=l||'—';
    byId('piEmail').textContent=e||'—';
    var ph=byId('piPhone');
    ph.textContent=p||'Your number here';
    ph.classList.toggle('pi-placeholder',!p);
    byId('welcomeMsg').textContent='Welcome, '+(n+' '+l).trim();
    byId('editPanel').classList.remove('open');
    byId('piCard').style.display='block';
    toast('✅ Information updated');
  });

  /* ── SCHEDULE PANEL ── */
  function openSched(){
    byId('schedLeft').style.display='';
    byId('schedSummary').classList.remove('show');
    byId('btnConfirmAppt').style.display='none';
    byId('schedPanel').classList.add('open');
    picked=null;
    buildCal();
  }
  byId('btnOpenSched').addEventListener('click', openSched);
  byId('btnOpenSchedWelcome').addEventListener('click', openSched);
  byId('btnSchedClose').addEventListener('click',function(){
    byId('schedPanel').classList.remove('open');
  });

  /* ── DOCTOR LIST ── */
  byId('docSearch').addEventListener('input',function(){
    var q=this.value.toLowerCase();
    [].slice.call(byId('docList').querySelectorAll('.doc-item')).forEach(function(d){
      d.style.display=d.textContent.toLowerCase().includes(q)?'':'none';
    });
  });
  [].slice.call(byId('docList').querySelectorAll('.doc-item')).forEach(function(el){
    el.addEventListener('click',function(){
      [].slice.call(byId('docList').querySelectorAll('.doc-item')).forEach(function(d){ d.classList.remove('sel'); });
      el.classList.add('sel');
    });
  });

  /* ── CALENDAR ── */
  var MES=['Enero','Febrero','Marzo','Abril','Mayo','Junio',
           'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var calY=2025, calM=1, picked=null;

  function wkNum(y,m,d){
    var dt=new Date(Date.UTC(y,m,d));
    dt.setUTCDate(dt.getUTCDate()+4-(dt.getUTCDay()||7));
    var y0=new Date(Date.UTC(dt.getUTCFullYear(),0,1));
    return Math.ceil((((dt-y0)/86400000)+1)/7);
  }

  function buildCal(){
    byId('calMonthLbl').textContent='📅 '+MES[calM]+' '+calY;
    var tbody=byId('calBody');
    tbody.innerHTML='';
    var today=new Date();
    var firstDow=new Date(calY,calM,1).getDay();
    var total=new Date(calY,calM+1,0).getDate();
    for(var w=0;w<6;w++){
      var rs=w*7-firstDow+1;
      if(rs>total) break;
      var tr=document.createElement('tr');
      var ref=Math.max(1,Math.min(rs+3,total));
      var wkTd=document.createElement('td');
      wkTd.className='wn';
      wkTd.textContent=wkNum(calY,calM,ref);
      tr.appendChild(wkTd);
      for(var c=0;c<7;c++){
        var dn=rs+c;
        var td=document.createElement('td');
        if(dn<1||dn>total){
          td.className='empty';
        } else {
          td.textContent=dn;
          if(dn===today.getDate()&&calM===today.getMonth()&&calY===today.getFullYear())
            td.classList.add('today');
          if(picked&&dn===picked.d&&calM===picked.m&&calY===picked.y)
            td.classList.add('picked');
          (function(day,cell){
            cell.addEventListener('click',function(){
              picked={d:day,m:calM,y:calY};
              [].slice.call(byId('calBody').querySelectorAll('td')).forEach(function(t){ t.classList.remove('picked'); });
              cell.classList.add('picked');
              byId('sumDate').textContent=day+' de '+MES[calM]+' de '+calY;
              var selDoc=byId('docList').querySelector('.doc-item.sel');
              byId('sumDoc').textContent=selDoc?selDoc.textContent.trim():'—';
              byId('schedLeft').style.display='none';
              byId('schedSummary').classList.add('show');
              if(selDoc) byId('btnConfirmAppt').style.display='flex';
            });
          })(dn,td);
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  byId('calPrev').addEventListener('click',function(){ calM--; if(calM<0){calM=11;calY--;} buildCal(); });
  byId('calNext').addEventListener('click',function(){ calM++; if(calM>11){calM=0;calY++;} buildCal(); });

  byId('btnConfirmAppt').addEventListener('click',function(){
    var doc=byId('sumDoc').textContent;
    var date=byId('sumDate').textContent;
    var hh=byId('hourH').value.toString().padStart(2,'0');
    var mm=byId('hourM').value.toString().padStart(2,'0');
    byId('schedPanel').classList.remove('open');
    toast('✅ Cita confirmada · '+doc+' · '+date+' '+hh+':'+mm);
  });

})();