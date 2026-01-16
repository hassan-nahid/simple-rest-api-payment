"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdf = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const generatePdf = (invoiceData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ size: "A4", margin: 50 });
            const buffers = [];
            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", (err) => reject(err));
            // ==== Header ====
            doc
                .fillColor("#2E86C1")
                .fontSize(28)
                .font("Helvetica-Bold")
                .text("Subscription Invoice", { align: "center" });
            doc.moveDown(0.5);
            // ==== Line separator ====
            doc
                .strokeColor("#aaaaaa")
                .lineWidth(1)
                .moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();
            doc.moveDown(1);
            // ==== Invoice Info ====
            doc.fontSize(12).fillColor("#000").font("Helvetica");
            doc.text(`Transaction ID:`, 50, doc.y).font("Helvetica-Bold").text(`${invoiceData.transactionId}`, 160, doc.y - 15);
            doc.font("Helvetica").text(`Subscription Date:`, 50, doc.y + 10).font("Helvetica-Bold").text(`${invoiceData.subscriptionDate.toDateString()}`, 160, doc.y - 15);
            doc.font("Helvetica").text(`End Date:`, 50, doc.y + 10).font("Helvetica-Bold").text(`${invoiceData.endDate.toDateString()}`, 160, doc.y - 15);
            doc.font("Helvetica").text(`Customer:`, 50, doc.y + 10).font("Helvetica-Bold").text(`${invoiceData.userName}`, 160, doc.y - 15);
            doc.moveDown(2);
            // ==== Plan Details ====
            doc
                .fontSize(15)
                .fillColor("#444444")
                .font("Helvetica-Bold")
                .text("Plan Details", { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).fillColor("#000").font("Helvetica");
            doc.text(`Plan Name:`, 50, doc.y).font("Helvetica-Bold").text(`${invoiceData.planName}`, 160, doc.y - 15);
            doc.font("Helvetica").text(`Total Amount:`, 50, doc.y + 10).font("Helvetica-Bold").text(`${invoiceData.totalAmount.toFixed(2)} BDT`, 160, doc.y - 15);
            doc.moveDown(2);
            // ==== Footer ====
            doc
                .fontSize(12)
                .fillColor("#666666")
                .font("Helvetica-Oblique")
                .text("Thank you for subscribing to our service!", { align: "center" });
            doc.end();
        });
    }
    catch (error) {
        throw new AppError_1.default(401, `PDF creation error: ${error.message}`);
    }
});
exports.generatePdf = generatePdf;
