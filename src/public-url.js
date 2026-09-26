export function publicUrl(path){
 return typeof path==='string'&&path.startsWith('/')&&!path.startsWith('//')
  ? import.meta.env.BASE_URL+path.slice(1)
  : path;
}
