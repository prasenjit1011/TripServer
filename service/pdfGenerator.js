const puppeteer = require("puppeteer");

// const HtmlToPdf = async (htmlContent = '', path = '', option = {}, ) => {
//     const browser = await puppeteer.launch({ headless: false });
//     const page = await browser.newPage();

//     await page.setContent(htmlContent);

//     try {
//         page.pdf({
//             path: path,
//             format: "A4",
//             printBackground: true,
//             color: true,
//             ...option
//         });

//         return path
//     } catch (error) {
//         return error
//     } finally {
//         await browser.close();
//     }
// }



const HtmlToPdf = async (htmlContent = '', option = {}) => {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(htmlContent);

    try {
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            color: true,
            ...option,
        });

        return pdfBuffer;
    } catch (error) {
        throw error; // Propagate the error
    } finally {
        await page.close(); // Close the page
        await browser.close();
    }
};

module.exports = {
    HtmlToPdf
}