export default function generateCode(){
    const arr = []
    for (let i = 0; i < 3; i++){
        for (let i = 0; i < 4; i++){
            const charCode = Math.floor(Math.random() * 26) + 'A'.charCodeAt(0);
            const randomChar = String.fromCharCode(charCode);
            arr.push(randomChar);
        }
        arr.push('-');
    }
    return arr.slice(0, -1).join('');
}