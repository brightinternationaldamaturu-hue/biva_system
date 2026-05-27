export function showNotification(

title,
message,
type="success"

){

const div =
document.createElement("div");

div.className =
`notification ${type}`;

div.innerHTML = `

<h4>${title}</h4>

<p>${message}</p>

`;

document.body.appendChild(div);

setTimeout(()=>{

div.remove();

},4000);

}