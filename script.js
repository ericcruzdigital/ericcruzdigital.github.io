const menuButton=document.querySelector('[data-menu-button]');
const navLinks=document.querySelector('[data-nav-links]');
if(menuButton&&navLinks){
  menuButton.addEventListener('click',()=>{
    const open=navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded',String(open));
  });
}
document.querySelectorAll('a[href^="#"]').forEach(link=>{
  link.addEventListener('click',()=>{
    if(navLinks) navLinks.classList.remove('open');
    if(menuButton) menuButton.setAttribute('aria-expanded','false');
  });
});