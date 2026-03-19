import { type ParsedCidr } from "@/logic/types";
import { parseCIDR } from "ipaddr.js";

export function parseLst(content: string): { parsed: Array<ParsedCidr>, total: BigInt } {
    let total = BigInt(0);
    const parsed = content.split("\n")
        .map(l => l.trim())
        .filter(Boolean)
        .map(cidr => {
            try {
                const [net, bits] = parseCIDR(cidr);
                if (net.kind() == 'ipv4') {
                    total += BigInt(2) ** BigInt(32 - bits)
                }
                
                return {
                    net,
                    bits
                };
            } catch (e) { 
                return null;
            }
        })
        .filter(v => v !== null);

    return {
        parsed,
        total
    }
}