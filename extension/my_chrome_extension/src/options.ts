import './index.css';

let button = document.getElementById('requestPermission') as HTMLButtonElement;
button.className = 'text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800';

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
