const templates = {
  confirmacion: "Hola {name}, tu pedido '{description}' está confirmado 🚀",
  recordatorio: "Hola {name}, te recordamos que tienes pendiente: '{description}' 📝",
  seguimiento: "Hola {name}, ¿cómo va tu pedido '{description}'? ¿Necesitas algo más? 🤔",
  entrega: "Hola {name}, tu pedido '{description}' está listo para entrega! 🎉",
  agradecimiento: "Hola {name}, gracias por tu pedido '{description}'. ¡Esperamos verte pronto! 😊",
};

/**
 * Genera un mensaje de template reemplazando las variables
 * @param {string} templateType - Tipo de template
 * @param {Object} variables - Variables a reemplazar
 * @returns {string} - Mensaje generado
 */
function generateTemplate(templateType, variables = {}) {
  const template = templates[templateType];
  if (!template) {
    throw new Error(`Template '${templateType}' no encontrado`);
  }

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}

module.exports = {
  templates,
  generateTemplate,
};
