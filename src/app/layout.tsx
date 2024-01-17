import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "normalize.css";
import "./global.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Vending Machine",
    description: "Blue vending machine",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <main>{children}</main>
            </body>
        </html>
    );
}
