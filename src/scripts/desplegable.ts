/** Desplegables propios sobre los select nativos, que siguen siendo la fuente de verdad del formulario. */
import { icono } from '../lib/tarjeta';

type Desplegable = { select: HTMLSelectElement; pintar(): void };
const todos: Desplegable[] = [];
let abierto: (() => void) | null = null;

function mejorar(select: HTMLSelectElement) {
  const etiqueta = document.querySelector<HTMLLabelElement>(`label[for="${select.id}"]`)!;
  const boton = document.createElement('button');
  const texto = document.createElement('span');
  const lista = document.createElement('ul');
  const opciones = [...select.options];
  let activo = -1;
  let buscado = '';
  let espera = 0;

  etiqueta.id = `${select.id}-e`;
  boton.type = 'button';
  boton.className = 'desp-b';
  boton.id = `${select.id}-b`;
  boton.setAttribute('role', 'combobox');
  boton.setAttribute('aria-haspopup', 'listbox');
  boton.setAttribute('aria-expanded', 'false');
  boton.setAttribute('aria-controls', `${select.id}-l`);
  boton.setAttribute('aria-labelledby', `${etiqueta.id} ${boton.id}`);
  boton.append(texto);
  boton.insertAdjacentHTML('beforeend', icono('caret-down'));

  lista.id = `${select.id}-l`;
  lista.className = 'desp-l';
  lista.hidden = true;
  lista.setAttribute('role', 'listbox');
  lista.setAttribute('aria-labelledby', etiqueta.id);
  lista.innerHTML = opciones.map((_, i) => `<li role="option" id="${select.id}-o${i}" aria-selected="false"></li>`).join('');
  const filas = [...lista.children] as HTMLElement[];
  filas.forEach((f, i) => { f.textContent = opciones[i].textContent; f.insertAdjacentHTML('beforeend', icono('check')); });

  select.classList.add('desp-nativo');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  select.after(boton, lista);

  const pintar = () => {
    texto.textContent = select.selectedOptions[0]?.textContent ?? '';
    boton.classList.toggle('con-valor', select.selectedIndex > 0);
    filas.forEach((f, i) => f.setAttribute('aria-selected', String(i === select.selectedIndex)));
  };

  const marcar = (i: number) => {
    activo = i;
    filas.forEach((f, n) => f.classList.toggle('on', n === i));
    boton.setAttribute('aria-activedescendant', filas[i].id);
    filas[i].scrollIntoView({ block: 'nearest' });
  };

  const cerrar = () => {
    lista.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
    boton.removeAttribute('aria-activedescendant');
    abierto = null;
  };

  const abrir = () => {
    abierto?.();
    lista.hidden = false;
    boton.setAttribute('aria-expanded', 'true');
    const caja = boton.getBoundingClientRect();
    const abajo = innerHeight - caja.bottom;
    lista.classList.toggle('arriba', abajo < 240 && caja.top > abajo);
    marcar(Math.max(0, select.selectedIndex));
    abierto = cerrar;
  };

  const elegir = (i: number) => {
    const cambia = select.selectedIndex !== i;
    select.selectedIndex = i;
    pintar();
    cerrar();
    boton.focus();
    if (cambia) select.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const saltar = (letra: string) => {
    clearTimeout(espera);
    espera = window.setTimeout(() => { buscado = ''; }, 600);
    buscado += letra.toLowerCase();
    const i = opciones.findIndex((o) => o.textContent!.toLowerCase().startsWith(buscado));
    if (i >= 0) marcar(i);
  };

  etiqueta.addEventListener('click', (e) => { e.preventDefault(); boton.focus(); });
  boton.addEventListener('click', () => (lista.hidden ? abrir() : cerrar()));
  boton.addEventListener('blur', () => { if (!lista.hidden) window.setTimeout(() => { if (document.activeElement !== boton) cerrar(); }, 120); });
  lista.addEventListener('mousedown', (e) => e.preventDefault());
  lista.addEventListener('click', (e) => {
    const fila = (e.target as Element).closest('li');
    if (fila) elegir(filas.indexOf(fila));
  });
  lista.addEventListener('pointermove', (e) => {
    const fila = (e.target as Element).closest('li');
    if (fila && filas.indexOf(fila) !== activo) { activo = filas.indexOf(fila); filas.forEach((f) => f.classList.toggle('on', f === fila)); boton.setAttribute('aria-activedescendant', fila.id); }
  });
  boton.addEventListener('keydown', (e) => {
    const cerrado = lista.hidden;
    if (cerrado && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); abrir(); return; }
    if (cerrado) return;
    const ultimo = filas.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); marcar(Math.min(ultimo, activo + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(Math.max(0, activo - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); marcar(0); }
    else if (e.key === 'End') { e.preventDefault(); marcar(ultimo); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(activo); }
    else if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
    else if (e.key === 'Tab') cerrar();
    else if (e.key.length === 1) saltar(e.key);
  });

  pintar();
  todos.push({ select, pintar });
}

export const mejorarDesplegables = (raiz: ParentNode) => raiz.querySelectorAll('select').forEach(mejorar);
export const sincronizarDesplegables = () => todos.forEach((d) => d.pintar());
