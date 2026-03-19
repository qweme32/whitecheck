import { type ParsedCidr } from "@/logic/types";
import { IPv4, IPv6 } from "ipaddr.js";

export function check(
    target: IPv4 | IPv6,
    cidrs: Array<ParsedCidr>
): boolean {
    for (const { net, bits } of cidrs) {
        if (target.kind() !== net.kind()) continue; // IPv4 vs IPv6

        if (target.match(net, bits)) {
            return true;
        }
    }

    return false;
}