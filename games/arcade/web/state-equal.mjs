// Native JSON sorts object keys; browser-created pickups keep insertion order.
// Compare JSON values, not their serialization order, before reconciling input.
export function sameGameState(a,b){
  if(a===b)return true;
  if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return false;
  if(Array.isArray(a)!==Array.isArray(b))return false;
  const keys=Object.keys(a);
  return keys.length===Object.keys(b).length&&keys.every(key=>Object.hasOwn(b,key)&&sameGameState(a[key],b[key]));
}
