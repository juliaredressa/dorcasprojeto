const assistenteSocialRoutes = [
  '/gestante',
  '/triagem',
  '/kits',
  '/fila-prioridade',
  '/eventos',
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

export function hasFullAccess(user) {
  return Boolean(user?.is_admin);
}

export function canAccessPath(user, pathname) {
  if (hasFullAccess(user) || normalize(user?.cargo) !== 'assistente social') {
    return true;
  }

  return pathname === '/' || assistenteSocialRoutes.some((route) => (
    pathname === route || pathname.startsWith(`${route}/`)
  ));
}

export function isAssistenteSocial(user) {
  return !hasFullAccess(user) && normalize(user?.cargo) === 'assistente social';
}
