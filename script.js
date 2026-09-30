document.documentElement.classList.add('js');
const menuButton = document.querySelector('[data-menu-button]');
const navigation = document.getElementById('site-nav');
function closeMenu(){if(!menuButton||!navigation)return;menuButton.setAttribute('aria-expanded','false');navigation.classList.remove('is-open');}
if(menuButton&&navigation){menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));navigation.classList.toggle('is-open',open);});navigation.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuButton.getAttribute('aria-expanded')==='true'){closeMenu();menuButton.focus();}});window.matchMedia('(min-width: 681px)').addEventListener('change',closeMenu);}
document.querySelectorAll('[data-print]').forEach(button=>button.addEventListener('click',()=>window.print()));
