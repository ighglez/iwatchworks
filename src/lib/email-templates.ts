import { RULES, SITE } from "./config";
import { euros } from "./money";

/*
 * Plantillas de los correos a clientes. Diseño de marca común: banda burdeos con la
 * corona y el nombre, cuerpo blanco sobre fondo crema y pie discreto.
 * HTML de tablas con estilos en línea para que se vea bien en Gmail, Outlook y Apple Mail.
 */

export type Email = { subject: string; html: string; text: string };

const C = {
  bg: "#F3F0EA",
  card: "#FFFFFF",
  ink: "#141413",
  soft: "#55524C",
  muted: "#8C887F",
  line: "#E7E3DA",
  brand: "#7A1F2E",
  night: "#4E1420",
  gold: "#C6A664",
  goldLight: "#E3D3AC",
  cream: "#F9F9F7",
};
const FONT = `'Helvetica Neue',Helvetica,Arial,sans-serif`;

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || "";

const abs = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE.url}${path.startsWith("/") ? "" : "/"}${path}`);

/* ---------- piezas ---------- */

function eyebrow(t: string) {
  return `<p style="margin:0 0 14px;font:600 11px/1 ${FONT};letter-spacing:2.5px;text-transform:uppercase;color:${C.brand}">${esc(t)}</p>`;
}
function h1(t: string) {
  return `<h1 class="h1" style="margin:0 0 18px;font:300 30px/1.2 ${FONT};letter-spacing:-0.3px;color:${C.ink}">${t}</h1>`;
}
function p(html: string, extra = "") {
  return `<p style="margin:0 0 16px;font:400 15px/1.65 ${FONT};color:${C.soft};${extra}">${html}</p>`;
}
function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px"><tr><td style="border-radius:999px;background:${C.brand}">
    <a href="${href}" style="display:inline-block;padding:15px 34px;font:600 12px/1 ${FONT};letter-spacing:2px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:999px">${esc(label)}</a>
  </td></tr></table>`;
}
function rule(space = 28) {
  return `<div style="height:1px;line-height:1px;font-size:1px;background:${C.line};margin:${space}px 0">&nbsp;</div>`;
}
function sectionTitle(t: string) {
  return `<p style="margin:0 0 12px;font:600 11px/1 ${FONT};letter-spacing:2.5px;text-transform:uppercase;color:${C.muted}">${esc(t)}</p>`;
}
/** Tabla de dos columnas: etiqueta / valor. */
function details(rows: [string, string, { strong?: boolean; accent?: boolean; mono?: boolean }?][]) {
  const tr = rows
    .map(([k, v, o = {}]) => `<tr>
      <td style="padding:11px 0;border-bottom:1px solid ${C.line};font:400 13px/1.4 ${FONT};color:${C.muted}">${esc(k)}</td>
      <td align="right" style="padding:11px 0;border-bottom:1px solid ${C.line};font:${o.strong ? 600 : 500} ${o.strong ? 16 : 14}px/1.4 ${o.mono ? "'SFMono-Regular',Menlo,Consolas,monospace" : FONT};color:${o.accent ? "#1F7A4D" : C.ink};letter-spacing:${o.mono ? "0.5px" : "0"}">${v}</td>
    </tr>`)
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line}">${tr}</table>`;
}
function note(html: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0"><tr><td style="background:${C.cream};border-left:2px solid ${C.gold};padding:14px 18px;font:400 13px/1.6 ${FONT};color:${C.soft}">${html}</td></tr></table>`;
}

type Item = { name: string; reference?: string | null; image?: string | null; price: number; quantity: number };
function itemsBlock(items: Item[]) {
  return items
    .map((i) => {
      const img = i.image
        ? `<td width="72" style="padding:12px 16px 12px 0;vertical-align:middle"><img src="${abs(i.image)}" width="72" height="72" alt="" style="display:block;width:72px;height:72px;border-radius:10px;object-fit:cover;background:${C.bg}"></td>`
        : "";
      return `<tr>
        ${img}
        <td style="padding:12px 0;vertical-align:middle;font:400 14px/1.45 ${FONT};color:${C.ink}">
          ${esc(i.name)}${i.reference ? `<br><span style="font-size:12px;color:${C.muted}">Ref. ${esc(i.reference)}${i.quantity > 1 ? ` · ${i.quantity} uds.` : ""}</span>` : i.quantity > 1 ? `<br><span style="font-size:12px;color:${C.muted}">${i.quantity} uds.</span>` : ""}
        </td>
        <td align="right" style="padding:12px 0;vertical-align:middle;font:500 14px/1.4 ${FONT};color:${C.ink};white-space:nowrap">${euros(i.price * i.quantity)}</td>
      </tr>`;
    })
    .join("");
}

type Totals = { subtotal: number; welcomeDiscount: number; codeDiscount: number; discountCode: string | null; pointsDiscount: number; pointsRedeemed: number; shipping: number; total: number };
function totalsBlock(o: Totals) {
  const rows: [string, string, { strong?: boolean; accent?: boolean }?][] = [["Subtotal", euros(o.subtotal)]];
  if (o.welcomeDiscount > 0) rows.push([`Bienvenida ${RULES.welcomeDiscountPercent}%`, `−${euros(o.welcomeDiscount)}`, { accent: true }]);
  if (o.codeDiscount > 0) rows.push([`Código ${o.discountCode ?? ""}`, `−${euros(o.codeDiscount)}`, { accent: true }]);
  if (o.pointsDiscount > 0) rows.push([`${o.pointsRedeemed} puntos`, `−${euros(o.pointsDiscount)}`, { accent: true }]);
  rows.push(["Envío asegurado", o.shipping ? euros(o.shipping) : "Gratis"]);
  rows.push(["Total (IVA incl.)", euros(o.total), { strong: true }]);
  return details(rows);
}

function layout({ preheader, body, reason }: { preheader: string; body: string; reason: string }) {
  const legal = SITE.legal.company.startsWith("[") ? "" : ` · ${esc(SITE.legal.company)}`;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(SITE.name)}</title><style>@media (max-width:620px){.body{padding:32px 22px 30px!important}.h1{font-size:26px!important}.perk{width:72px!important;font-size:19px!important}}</style></head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg}">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg}"><tr><td align="center" style="padding:32px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
    <tr><td align="center" style="background:${C.night};padding:34px 24px 30px;border-radius:18px 18px 0 0">
      <a href="${SITE.url}" style="text-decoration:none">
        <img src="${SITE.url}/email/crown.png" width="32" height="16" alt="" style="display:block;margin:0 auto 10px;border:0">
        <span style="font:600 17px/1 ${FONT};letter-spacing:6px;color:${C.cream}">IWATCHWORKS</span>
      </a>
      <div style="width:40px;height:1px;line-height:1px;font-size:1px;background:${C.gold};margin:16px auto 0">&nbsp;</div>
    </td></tr>
    <tr><td style="background:${C.card};padding:44px 44px 40px;border-radius:0 0 18px 18px" class="body">
      ${body}
      <p style="margin:32px 0 0;font:400 15px/1.6 ${FONT};color:${C.soft}">Un saludo,<br><span style="color:${C.ink}">El equipo de ${esc(SITE.name)}</span></p>
    </td></tr>
    <tr><td align="center" style="padding:28px 24px 8px">
      <p style="margin:0 0 10px;font:500 11px/1.6 ${FONT};letter-spacing:2px;text-transform:uppercase;color:${C.soft}">
        <a href="${SITE.url}/tienda" style="color:${C.soft};text-decoration:none">Colección</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${SITE.url}/seguimiento" style="color:${C.soft};text-decoration:none">Mi pedido</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${SITE.url}/#contacto" style="color:${C.soft};text-decoration:none">Contacto</a>
      </p>
      <p style="margin:0;font:400 12px/1.7 ${FONT};color:${C.muted}">
        Envío asegurado gratuito · 3 años de garantía · 14 días de devolución<br>
        <a href="mailto:${SITE.email}" style="color:${C.muted}">${SITE.email}</a>${legal}<br>
        ${esc(reason)}
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

/** Versión de texto plano a partir de las líneas que interesan (mejora la entrega y se lee en cualquier app). */
function plain(lines: (string | false | null | undefined)[]) {
  return [...lines.filter((l): l is string => typeof l === "string"), "", `Un saludo,`, `El equipo de ${SITE.name}`, SITE.url].join("\n");
}

/* ---------- correos ---------- */

export function welcomeEmail(u: { name: string; email: string }, opts: { fromCheckout?: boolean; claimedPoints?: number } = {}): Email {
  const name = esc(firstName(u.name));
  const body = `
    ${eyebrow("Bienvenido al club")}
    ${h1(`${name}, ya formas parte de ${esc(SITE.name)}`)}
    ${p("Gracias por crear tu cuenta. A partir de hoy tienes un sitio donde guardar tus pedidos, tu dirección y las ventajas que vas sumando con cada reloj.")}
    ${rule()}
    ${sectionTitle("Tus ventajas")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${[
        opts.claimedPoints
          ? [`${opts.claimedPoints}`, "puntos ya sumados a tu cuenta por tu pedido."]
          : [`${RULES.welcomeDiscountPercent}%`, opts.fromCheckout ? "de bienvenida, ya aplicado en tu primer pedido." : "de descuento en tu primera compra, aplicado automáticamente al pagar."],
        [`${RULES.pointsPerEuro} punto`, `por cada euro. Cada ${RULES.pointsBlock} puntos son ${euros(RULES.pointsBlockValueCents)} para tu próximo reloj.`],
        ["24-72 h", "envío asegurado y gratuito, con seguimiento desde tu cuenta."],
      ]
        .map(([k, v]) => `<tr>
          <td width="96" class="perk" style="padding:12px 16px 12px 0;vertical-align:top;font:300 22px/1.2 ${FONT};color:${C.brand};white-space:nowrap">${k}</td>
          <td style="padding:14px 0 12px;vertical-align:top;font:400 14px/1.55 ${FONT};color:${C.soft}">${v}</td>
        </tr>`)
        .join("")}
    </table>
    ${opts.fromCheckout || opts.claimedPoints ? button("Ver mi cuenta", `${SITE.url}/cuenta`) : button("Descubrir la colección", `${SITE.url}/tienda`)}
    ${note(`Tu cuenta es <b style="color:${C.ink}">${esc(u.email)}</b>. Si no la has creado tú, escríbenos a <a href="mailto:${SITE.email}" style="color:${C.brand}">${SITE.email}</a>.`)}`;
  return {
    subject: `Bienvenido a ${SITE.name}, ${firstName(u.name)}`,
    html: layout({ preheader: opts.claimedPoints ? `Tu cuenta está lista y ya tienes ${opts.claimedPoints} puntos.` : `Tu cuenta está lista. Tienes un ${RULES.welcomeDiscountPercent}% de bienvenida y empiezas a sumar puntos.`, body, reason: "Recibes este correo porque has creado una cuenta en nuestra tienda." }),
    text: plain([
      `Hola ${firstName(u.name)}, ya formas parte de ${SITE.name}.`,
      "",
      opts.claimedPoints ? `- ${opts.claimedPoints} puntos ya sumados por tu pedido.` : `- ${RULES.welcomeDiscountPercent}% de bienvenida en tu primera compra.`,
      `- ${RULES.pointsPerEuro} punto por euro: cada ${RULES.pointsBlock} puntos son ${euros(RULES.pointsBlockValueCents)}.`,
      "- Envío asegurado y gratuito en 24-72 h.",
      "",
      `Colección: ${SITE.url}/tienda`,
    ]),
  };
}

type OrderForEmail = Totals & {
  number: string;
  name: string;
  email: string;
  accessToken: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  pointsEarned: number;
  userId?: string | null;
  items: Item[];
};
const orderUrl = (o: { number: string; accessToken: string }) => `${SITE.url}/pedido/${o.number}?t=${o.accessToken}`;
const shipTo = (o: OrderForEmail) => `${esc(o.name)}<br>${esc(o.address)}<br>${esc(o.postalCode)} ${esc(o.city)} (${esc(o.province)})`;

export function transferEmail(
  o: OrderForEmail,
  bank: { holder: string; iban: string; bic: string; bank: string },
  deadline: string,
): Email {
  const name = esc(firstName(o.name));
  const body = `
    ${eyebrow(`Pedido ${o.number}`)}
    ${h1(`Tu reloj está reservado, ${name}`)}
    ${p(`Gracias por confiar en nosotros. Hemos apartado tu pedido y lo mantendremos reservado hasta el <b style="color:${C.ink}">${esc(deadline)}</b>. Solo falta la transferencia.`)}
    ${rule(24)}
    ${sectionTitle("Datos para la transferencia")}
    ${details([
      ["Importe", euros(o.total), { strong: true }],
      ["Concepto", esc(o.number), { mono: true }],
      ["Titular", esc(bank.holder)],
      ["IBAN", esc(bank.iban), { mono: true }],
      ...(bank.bic ? ([["BIC/SWIFT", esc(bank.bic), { mono: true }]] as [string, string, { mono: boolean }][]) : []),
      ...(bank.bank ? ([["Banco", esc(bank.bank)]] as [string, string][]) : []),
    ])}
    ${p(`Indica <b style="color:${C.ink}">${esc(o.number)}</b> como concepto para que podamos identificar tu pago. En cuanto lo recibamos te escribiremos y empezaremos a preparar tu reloj.`, "margin-top:18px")}
    ${button("Ver mi pedido", orderUrl(o))}
    ${rule()}
    ${sectionTitle("Tu pedido")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${itemsBlock(o.items)}</table>
    <div style="height:12px"></div>
    ${totalsBlock(o)}
    ${note(`<b style="color:${C.ink}">Por tu seguridad:</b> nunca te pediremos que pagues a otra cuenta por email, WhatsApp o teléfono. Antes de transferir, comprueba que el IBAN coincide con el de tu pedido en nuestra web.`)}`;
  return {
    subject: `Pedido ${o.number}: tu reloj está reservado`,
    html: layout({ preheader: `Transfiere ${euros(o.total)} con el concepto ${o.number} antes del ${deadline}.`, body, reason: "Recibes este correo porque has hecho un pedido en nuestra tienda." }),
    text: plain([
      `Hola ${firstName(o.name)}, tu reloj está reservado hasta el ${deadline}.`,
      "",
      "Datos para la transferencia:",
      `Importe: ${euros(o.total)}`,
      `Concepto: ${o.number}`,
      `Titular: ${bank.holder}`,
      `IBAN: ${bank.iban}`,
      bank.bic && `BIC/SWIFT: ${bank.bic}`,
      bank.bank && `Banco: ${bank.bank}`,
      "",
      ...o.items.map((i) => `- ${i.name} × ${i.quantity}: ${euros(i.price * i.quantity)}`),
      "",
      "Por tu seguridad: nunca te pediremos que pagues a otra cuenta por email, WhatsApp o teléfono.",
      `Tu pedido: ${orderUrl(o)}`,
    ]),
  };
}

export function paidEmail(o: OrderForEmail): Email {
  const name = esc(firstName(o.name));
  const body = `
    ${eyebrow(`Pedido ${o.number} · Pago recibido`)}
    ${h1(`Gracias, ${name}. Tu pedido está confirmado`)}
    ${p("Hemos recibido tu pago. A partir de ahora revisamos tu reloj, lo preparamos con su caja y documentación y lo enviamos asegurado. Te escribiremos de nuevo con el número de seguimiento en cuanto salga.")}
    ${button("Seguir mi pedido", orderUrl(o))}
    ${rule()}
    ${sectionTitle("Resumen")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${itemsBlock(o.items)}</table>
    <div style="height:12px"></div>
    ${totalsBlock(o)}
    ${rule()}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="50%" style="vertical-align:top;padding-right:12px">${sectionTitle("Envío a")}<p style="margin:0;font:400 14px/1.6 ${FONT};color:${C.soft}">${shipTo(o)}</p></td>
      <td width="50%" style="vertical-align:top;padding-left:12px">${sectionTitle("Próximos pasos")}<p style="margin:0;font:400 14px/1.6 ${FONT};color:${C.soft}">Preparación y envío asegurado en 24-72 h. Tienes 14 días para devolverlo.</p></td>
    </tr></table>
    ${o.userId && o.pointsEarned > 0 ? note(`Con esta compra sumas <b style="color:${C.ink}">${o.pointsEarned} puntos</b> a tu cuenta para tu próximo reloj.`) : ""}`;
  return {
    subject: `Pago recibido: pedido ${o.number} confirmado`,
    html: layout({ preheader: "Hemos recibido tu pago y ya estamos preparando tu reloj.", body, reason: "Recibes este correo porque has hecho un pedido en nuestra tienda." }),
    text: plain([
      `Gracias, ${firstName(o.name)}. Hemos recibido tu pago y tu pedido ${o.number} está confirmado.`,
      "",
      ...o.items.map((i) => `- ${i.name} × ${i.quantity}: ${euros(i.price * i.quantity)}`),
      `Total: ${euros(o.total)}`,
      "",
      `Envío a: ${o.name}, ${o.address}, ${o.postalCode} ${o.city} (${o.province})`,
      o.userId && o.pointsEarned > 0 ? `Has sumado ${o.pointsEarned} puntos.` : null,
      `Seguir mi pedido: ${orderUrl(o)}`,
    ]),
  };
}

export function shippedEmail(o: { number: string; name: string; accessToken: string; carrier: string | null; trackingNumber: string | null }): Email {
  const name = esc(firstName(o.name));
  const body = `
    ${eyebrow(`Pedido ${o.number} · Enviado`)}
    ${h1(`${name}, tu reloj ya está en camino`)}
    ${p("Lo hemos revisado, embalado y entregado a la agencia con envío asegurado. Normalmente llega en 24 a 72 horas laborables.")}
    ${details([
      ["Agencia", esc(o.carrier || "Envío asegurado")],
      ["Seguimiento", esc(o.trackingNumber || "Te lo enviaremos en breve"), { mono: true }],
    ])}
    ${button("Ver el envío", orderUrl(o))}
    ${note("Al recibirlo, comprueba que el paquete llega precintado. Si notas cualquier cosa extraña, anótalo al repartidor y escríbenos.")}`;
  return {
    subject: `Tu reloj está en camino · pedido ${o.number}`,
    html: layout({ preheader: `Enviado con ${o.carrier || "envío asegurado"}${o.trackingNumber ? `, seguimiento ${o.trackingNumber}` : ""}.`, body, reason: "Recibes este correo porque has hecho un pedido en nuestra tienda." }),
    text: plain([
      `${firstName(o.name)}, tu reloj (pedido ${o.number}) ya está en camino.`,
      `Agencia: ${o.carrier || "Envío asegurado"}`,
      o.trackingNumber && `Seguimiento: ${o.trackingNumber}`,
      `Ver el envío: ${orderUrl(o)}`,
    ]),
  };
}

export function cancelledEmail(o: { number: string; name: string; total: number }, why: "expired" | "store"): Email {
  const name = esc(firstName(o.name));
  const expired = why === "expired";
  const body = `
    ${eyebrow(`Pedido ${o.number}`)}
    ${h1(expired ? `${name}, tu reserva ha caducado` : `${name}, hemos cancelado tu pedido`)}
    ${p(expired
      ? `No hemos recibido la transferencia en los ${RULES.transferDays} días de reserva, así que el pedido se ha cancelado y el reloj vuelve a estar disponible. Si ya la habías hecho, no te preocupes: escríbenos con el justificante y lo solucionamos.`
      : "Tu pedido ha sido cancelado. Si se había hecho algún pago, te lo devolveremos íntegramente por el mismo medio. Si tienes cualquier duda, responde a este correo.")}
    ${button(expired ? "Volver a la colección" : "Ver la colección", `${SITE.url}/tienda`)}`;
  return {
    subject: expired ? `Tu reserva del pedido ${o.number} ha caducado` : `Pedido ${o.number} cancelado`,
    html: layout({ preheader: expired ? "No hemos recibido la transferencia a tiempo." : "Tu pedido ha sido cancelado.", body, reason: "Recibes este correo porque hiciste un pedido en nuestra tienda." }),
    text: plain([
      expired
        ? `${firstName(o.name)}, no hemos recibido la transferencia del pedido ${o.number} en ${RULES.transferDays} días y se ha cancelado. Si ya la hiciste, escríbenos con el justificante.`
        : `${firstName(o.name)}, tu pedido ${o.number} ha sido cancelado. Si habías pagado, te lo devolveremos íntegramente.`,
    ]),
  };
}

export function passwordResetEmail(u: { name: string }, url: string): Email {
  const body = `
    ${eyebrow("Tu cuenta")}
    ${h1(`Elige una nueva contraseña, ${esc(firstName(u.name))}`)}
    ${p("Hemos recibido una petición para restablecer la contraseña de tu cuenta. Pulsa el botón para elegir una nueva. El enlace es válido durante una hora.")}
    ${button("Elegir contraseña", url)}
    ${note("Si no lo has pedido tú, ignora este correo: tu contraseña actual sigue funcionando y nadie puede cambiarla sin este enlace.")}`;
  return {
    subject: `Restablecer tu contraseña · ${SITE.name}`,
    html: layout({ preheader: "Enlace válido durante una hora.", body, reason: "Recibes este correo porque se ha pedido restablecer la contraseña de tu cuenta." }),
    text: plain([`Hola ${firstName(u.name)}, elige una nueva contraseña en este enlace (válido 1 hora):`, url, "", "Si no lo has pedido tú, ignora este correo."]),
  };
}

export function adminAlertEmail(title: string, html: string): Email {
  const body = `${eyebrow("Aviso de seguridad")}${h1(esc(title))}${p(html)}`;
  return {
    subject: `Aviso de seguridad: ${title} · ${SITE.name}`,
    html: layout({ preheader: title, body, reason: "Aviso automático del panel de administración." }),
    text: plain([title, html.replace(/<[^>]+>/g, "")]),
  };
}
