

export function formatSize(mb,unit){
    let bytes = mb * 1000000;
    //console.log(bytes);
    let formatted;
    if(!unit){
        formatted = formatBytes(bytes);
    }else{
        formatted = formatBytes(bytes,0,unit);
    }
    return formatted;
}


const formatBytes = (bytes, decimals = 2, unit) =>{
    if (bytes === 0) return '0 Bytes';
    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    let result;
    if(!unit){
        result = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }else{
        result = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    }

    return result;
}