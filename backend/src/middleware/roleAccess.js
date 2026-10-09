const allowedAssistenteSocialRoutes = [
    { method: null, pattern: /^\/(?:api\/)?gestantes?(?:\/|$)/ },
    { method: null, pattern: /^\/api\/triagens(?:\/|$)/ },
    { method: null, pattern: /^\/api\/kits(?:\/|$)/ },
    { method: null, pattern: /^\/api\/fila-prioridade(?:\/|$)/ },
    { method: null, pattern: /^\/api\/eventos(?:\/|$)/ },
    { method: "GET", pattern: /^\/api\/doacoes\/itens-disponiveis$/ }
];

function normalize(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLocaleLowerCase("pt-BR");
}

function requireRoleAccess(req, res, next) {
    const user = req.session?.usuario;
    if (!user) {
        return res.status(401).json({
            mensagem: "Autenticação necessária para acessar este recurso."
        });
    }

    if (user.is_admin || normalize(user.cargo) !== "assistente social") {
        return next();
    }

    const pathname = req.originalUrl.split("?")[0];
    const hasAccess = allowedAssistenteSocialRoutes.some(({ method, pattern }) => (
        (!method || req.method === method) && pattern.test(pathname)
    ));

    if (!hasAccess) {
        return res.status(403).json({
            mensagem: "Seu perfil de Assistente Social não tem acesso a esta funcionalidade."
        });
    }

    return next();
}

module.exports = requireRoleAccess;
