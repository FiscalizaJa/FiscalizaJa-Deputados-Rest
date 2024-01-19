import axios from "axios";

/**
 * Download a file without use of stream. Not recommended for large files
 * @param url Url of file to be downloaded.
 */
async function downloadFileWithoutStream(url: string) {
    const request = await axios.get(url, {
        responseType: "arraybuffer"
    })

    return request.data
}

export default downloadFileWithoutStream