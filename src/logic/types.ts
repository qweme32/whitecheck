import { IPv4, IPv6 } from "ipaddr.js";

export type ParsedCidr = {
    net: IPv4 | IPv6;
    bits: number
}