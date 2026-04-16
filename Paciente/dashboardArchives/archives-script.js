(function(){
  // ----- DOM helpers -----
  const byId = (id) => document.getElementById(id);
  const showToast = (msg) => {
    const t = byId('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  };

  // ----- FILE STORAGE (per category, each file = object with metadata) -----
  const CATEGORIES = ['Radiografías', 'Estudios de laboratorio', 'Rayos X', 'Análisis', 'Exámenes'];
  let filesStore = {
    'Radiografías': [],
    'Estudios de laboratorio': [],
    'Rayos X': [],
    'Análisis': [],
    'Exámenes': []
  };

  let currentCategory = 'Radiografías';

  // ----- helper: format file size (bytes -> human readable) -----
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // ----- detect file type based on extension (icon mapping) -----
  function getFileTypeFromName(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet';
    if (['txt', 'md', 'rtf'].includes(ext)) return 'text';
    return 'other';
  }

  // ----- return icon emoji based on type -----
  function getFileIcon(type) {
    const iconMap = {
      image: '🖼️',
      pdf: '📄',
      doc: '📝',
      sheet: '📊',
      text: '📃',
      other: '📎'
    };
    return iconMap[type] || '📎';
  }

  // ----- format date: "Mar 5, 2026" like doctor version -----
  function formatDate(dateObj) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
  }

  // ----- create file metadata from native File object -----
  function buildFileMetadata(file) {
    const type = getFileTypeFromName(file.name);
    const now = new Date();
    return {
      name: file.name,
      date: formatDate(now),
      size: formatFileSize(file.size),
      rawSize: file.size,
      type: type,
      icon: getFileIcon(type)
    };
  }

  // ----- RENDER current category files (full list with delete + metadata) -----
  function renderCurrentCategory() {
    const container = byId('archiveList');
    const emptyDiv = byId('emptyState');
    const files = filesStore[currentCategory] || [];

    container.innerHTML = '';

    if (files.length === 0) {
      emptyDiv.style.display = 'flex';
      return;
    }
    emptyDiv.style.display = 'none';

    files.forEach((file, idx) => {
      const card = document.createElement('div');
      card.className = 'file-card';

      const iconSpan = document.createElement('div');
      iconSpan.className = 'file-icon';
      iconSpan.textContent = file.icon || getFileIcon(file.type);
      
      const infoDiv = document.createElement('div');
      infoDiv.className = 'file-info';
      const nameSpan = document.createElement('div');
      nameSpan.className = 'file-name';
      nameSpan.textContent = file.name;
      const metaSpan = document.createElement('div');
      metaSpan.className = 'file-meta';
      metaSpan.innerHTML = `<span>📅 ${file.date}</span><span>💾 ${file.size}</span>`;
      
      infoDiv.appendChild(nameSpan);
      infoDiv.appendChild(metaSpan);
      
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete';
      delBtn.innerHTML = '🗑️';
      delBtn.setAttribute('data-index', idx);
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filesStore[currentCategory].splice(idx, 1);
        renderCurrentCategory();
        showToast(`🗑️ "${file.name}" removed`);
      });
      
      card.appendChild(iconSpan);
      card.appendChild(infoDiv);
      card.appendChild(delBtn);
      container.appendChild(card);
    });
  }

  // ----- update title & re-render on category change -----
  function setCategory(cat) {
    currentCategory = cat;
    byId('contentTitle').textContent = cat;
    renderCurrentCategory();
  }

  // ----- handle multiple file upload (add files to current category) -----
  function addFilesToCurrentCategory(fileList) {
    if (!fileList || fileList.length === 0) return false;
    let addedCount = 0;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const metadata = buildFileMetadata(file);
      filesStore[currentCategory].unshift(metadata);
      addedCount++;
    }
    renderCurrentCategory();
    showToast(`✅ ${addedCount} file(s) uploaded to ${currentCategory}`);
    return true;
  }

  // ----- MODAL LOGIC -----
  const modal = byId('uploadModal');
  const uploadInner = byId('uploadInner');
  const fileInput = byId('fileInput');
  
  function openModal() {
    modal.classList.add('open');
  }
  function closeModal() {
    modal.classList.remove('open');
    uploadInner.classList.remove('dragover');
  }
  
  byId('btnSelect').addEventListener('click', openModal);
  byId('btnModalClose').addEventListener('click', closeModal);
  byId('btnModalMin').addEventListener('click', closeModal);
  
  byId('btnSelectModal').addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    if (fileInput.files && fileInput.files.length > 0) {
      addFilesToCurrentCategory(fileInput.files);
      fileInput.value = '';
      closeModal();
    }
  });
  
  uploadInner.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadInner.classList.add('dragover');
  });
  uploadInner.addEventListener('dragleave', () => {
    uploadInner.classList.remove('dragover');
  });
  uploadInner.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadInner.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addFilesToCurrentCategory(files);
      closeModal();
    } else {
      showToast('⚠️ No files detected');
    }
  });
  
  // ----- Category navigation (left panel) -----
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');
      if (cat) setCategory(cat);
    });
  });
  
  // ----- Top navigation (home / profile / logout) -----
  byId('btnHome').addEventListener('click', () => {
    window.location.href = 'dashboardSesion1.html'; // ruta de ejemplo ajustar según estructura real
  });
  byId('btnProfile').addEventListener('click', () => {
    window.location.href = 'perfil-paciente.html'; // ruta de ejemplo ajustar según estructura real
  });
  byId('btnLogout').addEventListener('click', () => {
    window.location.href = ''; // ruta de ejemplo ajustar según estructura real
  });
  
  // ----- OPTIONAL: preload demo files for better UX -----
  if (filesStore['Radiografías'].length === 0) {
    filesStore['Radiografías'].push({
      name: 'ejemplo_torax_marzo2025.png',
      date: 'March 10, 2025',
      size: '1.8 MB',
      type: 'image',
      icon: '🖼️'
    });
    filesStore['Estudios de laboratorio'].push({
      name: 'hemograma_completo_feb2025.pdf',
      date: 'February 18, 2025',
      size: '420 KB',
      type: 'pdf',
      icon: '📄'
    });
  }
  
  // initial render
  renderCurrentCategory();
})();