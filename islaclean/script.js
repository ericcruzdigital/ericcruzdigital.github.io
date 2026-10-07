
window.dataLayer = window.dataLayer || [];

document.querySelectorAll('[data-track]').forEach((el) => {
  el.addEventListener('click', () => {
    window.dataLayer.push({
      event: 'cta_click',
      cta_name: el.getAttribute('data-track'),
      page_path: window.location.pathname
    });
  });
});

document.querySelectorAll('[data-demo-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.dataLayer.push({
      event: 'demo_form_submit',
      form_name: form.getAttribute('data-demo-form'),
      page_path: window.location.pathname
    });
    const status = form.querySelector('[data-form-status]');
    if (status) {
      status.style.display = 'block';
      status.textContent = 'Demo only: no personal information was sent or stored.';
    }
    form.reset();
  });
});

// Enable the browser-only form only after its submit handler is registered.
document.querySelectorAll('[data-demo-fields]').forEach(fieldset => { fieldset.disabled = false; });
