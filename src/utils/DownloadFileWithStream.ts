import axios from "axios";
import { Stream } from "stream";

/**
 * Download a file using stream.
 * Recommended for large files
 * @param url the url to get file.
 */
async function DownloadFileWithStream(url: string) {
    const stream = await axios.get(url, { responseType: "stream" }).catch((e) => {
        throw new Error(e)
    })

    return stream.data as Stream
}

export default DownloadFileWithStream