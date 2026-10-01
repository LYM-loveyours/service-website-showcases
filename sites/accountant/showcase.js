/* Isolated public demo: prevents all form submissions, even if other handlers fail. */
 document.querySelectorAll('form').forEach(function(form) {
   form.addEventListener('submit', function(event) {
     event.preventDefault(); event.stopImmediatePropagation();
     if (!form.reportValidity()) return;
     var status = form.querySelector('[role="status"], [aria-live]') || document.createElement('p');
     if (!status.parentNode) form.appendChild(status);
     status.setAttribute('role','status'); status.setAttribute('tabindex','-1');
     status.textContent = 'Demonstration complete. No enquiry or booking was sent. Your contact entries have been cleared.';
     form.querySelectorAll('input[type="text"],input[type="email"],input[type="tel"],textarea').forEach(function(field){field.value='';});
     status.focus();
   }, true);
 });

const strip=document.querySelector(".example"); if(strip){const link=document.createElement("a");link.href="../../index.html";link.textContent="View collection ↗";link.style.cssText="color:inherit;margin-left:14px;white-space:nowrap";strip.appendChild(link);}
