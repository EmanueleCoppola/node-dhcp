/**
 * @license DHCP.js v0.2.18 28/06/2017
 * http://www.xarg.org/2017/06/a-pure-javascript-dhcp-implementation/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Copyright (c) 2019, Chemouni Uriel (uchemouni@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
/// <reference types="node" />
import { IDHCPMessage } from './model';
import SeqBuffer from './seqbuffer';
export declare const parse: (buf: Buffer) => IDHCPMessage;
export declare const format: (data: IDHCPMessage) => SeqBuffer;
