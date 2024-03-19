let button = document.getElementById('requestPermission') as HTMLButtonElement;

button.onclick = ()=>{
    console.log('reached onclick');

    if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: false, video: { width: 1280, height: 720 } })
        .then((stream: { id: string; }) => {
            console.log('success with streamid being ' + stream.id);
        })
        .catch((err: any) => {
            console.error(`The following error occurred: ${err.name}`);
        });
    } else {
        console.log("getUserMedia not supported");
    }
};
