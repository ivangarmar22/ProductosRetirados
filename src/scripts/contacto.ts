/** Formulario de contacto: el navegador envía el mensaje a Web3Forms, que lo reenvía a nuestro correo. */
import { mejorarDesplegables, sincronizarDesplegables } from './desplegable';

const form = document.querySelector<HTMLFormElement>('#contacto');

if (form) {
  const salida = form.querySelector<HTMLElement>('.salida')!;
  const boton = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const campos = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]')];

  const avisar = (texto: string, tipo: 'ok' | 'mal') => { salida.textContent = texto; salida.className = `salida ${tipo}`; };
  const terminar = () => { form.reset(); sincronizarDesplegables(); avisar('Mensaje enviado. Gracias por escribirnos.', 'ok'); };

  const comprobar = (c: HTMLInputElement | HTMLTextAreaElement) => {
    const bien = c.value.trim() !== '' && c.checkValidity();
    c.setAttribute('aria-invalid', String(!bien));
    document.getElementById(`${c.id}-e`)!.hidden = bien;
    return bien;
  };

  mejorarDesplegables(form);
  campos.forEach((c) => c.addEventListener('blur', () => { if (c.getAttribute('aria-invalid') === 'true' || c.value) comprobar(c); }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const malos = campos.filter((c) => !comprobar(c));
    if (malos.length) { malos[0].focus(); return; }

    const d = new FormData(form);
    const texto = (n: string) => String(d.get(n) ?? '').trim();
    const asunto = `${texto('motivo')} · Productos Retirados`;

    // Los robots rellenan el campo oculto: se les da por buenos sin enviar nada.
    if (texto('botcheck')) { terminar(); return; }

    boton.disabled = true;
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: form.dataset.clave, subject: asunto, from_name: texto('nombre') || 'Formulario de contacto', replyto: texto('correo'), email: texto('correo'), message: texto('mensaje') }),
      });
      if (!(await r.json()).success) throw new Error(String(r.status));
      terminar();
    } catch {
      avisar('No se ha podido enviar. Inténtalo de nuevo o escríbenos por correo.', 'mal');
    } finally {
      boton.disabled = false;
    }
  });
}
