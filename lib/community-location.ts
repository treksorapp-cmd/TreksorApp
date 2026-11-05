// City-level matching: never confuse York with New York or silently assign a country.
export const cleanPlace = (value: string) => value.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 100);
export const normalizePlace = (value: string) => cleanPlace(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/\s+/g, ' ');
export function matchesCity(stored: string, selected: string) {
 const a = normalizePlace(stored).split(',').map(s=>s.trim()).filter(Boolean);
 const b = normalizePlace(selected).split(',').map(s=>s.trim()).filter(Boolean);
 if (!b.length) return true;
 if (!a.length || a[0] !== b[0]) return false;
 // Legacy records without country remain discoverable; their full stored city is displayed.
 return a.length === 1 || b.length === 1 || b.slice(1).every(part=>a.slice(1).includes(part));
}
export function communityRoute(route: string, city: string) { return `${route}?city=${encodeURIComponent(cleanPlace(city))}`; }
export function localActivityUrl(city: string, activity = 'community activities') {
 return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activity} in ${cleanPlace(city)}`)}`;
}
export function upcomingEvents<T extends {city:string;starts_at:string}>(rows:T[],city:string,now=Date.now()) {
 return rows.filter(row=>matchesCity(row.city,city)&&Number.isFinite(Date.parse(row.starts_at))&&Date.parse(row.starts_at)>now).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
}
