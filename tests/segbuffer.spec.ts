// var should = require('should');
// import should from "should";
import { expect } from "chai";
import SeqBuffer from "../src/seqbuffer";

describe("Segbuffer", () => {
  it("should init correctly", () => {
    let sb = new SeqBuffer();
    expect(sb.buffer.length).be.equal(1500);
    sb = new SeqBuffer(null, 20);
    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(0);
    expect(sb.buffer.compare(new Buffer(20).fill(0))).be.equal(0);
  });

  it("should add uint8", () => {

    const sb = new SeqBuffer(null, 20);

    sb.addUInt8(1);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(1);

    sb.addUInt8(2);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(2);

    sb.addUInt8(99);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(3);

    expect(sb.buffer.compare(new Buffer([1, 2, 99, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).be.equal(0);
  });

  it("should get uint8", () => {

    const sb = new SeqBuffer(new Buffer([1, 2, 99, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));

    expect(sb.getUInt8()).be.equal(1);

    expect(sb.r).be.equal(1);
    expect(sb.w).be.equal(0);

    expect(sb.getUInt8()).be.equal(2);

    expect(sb.getUInt8()).be.equal(99);

    expect(sb.r).be.equal(3);
    expect(sb.w).be.equal(0);
  });

  it("should add uint16", () => {

    const sb = new SeqBuffer(null, 20);

    sb.addUInt16(1);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(2);

    sb.addUInt16(2);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(4);

    sb.addUInt16(99);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(6);

    expect(sb.buffer.compare(new Buffer([0, 1, 0, 2, 0, 99, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).be.equal(0);

  });

  it("should get uint16", () => {

    const sb = new SeqBuffer(new Buffer([0, 1, 0, 2, 0, 99, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));

    expect(sb.getUInt16()).be.equal(1);

    expect(sb.r).be.equal(2);
    expect(sb.w).be.equal(0);

    expect(sb.getUInt16()).be.equal(2);

    expect(sb.r).be.equal(4);
    expect(sb.w).be.equal(0);

    expect(sb.getUInt16()).be.equal(99);

    expect(sb.r).be.equal(6);
    expect(sb.w).be.equal(0);

  });

  it("should add uint32", () => {

    const sb = new SeqBuffer(null, 20);

    sb.addUInt32(1);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(4);

    sb.addUInt32(2);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(8);

    sb.addUInt32(99);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(12);

    expect(sb.buffer.compare(Buffer.from([0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 99, 0, 0, 0, 0, 0, 0, 0, 0]))).be.equal(0);

  });

  it("should get uint32", () => {

    const sb = new SeqBuffer(new Buffer([0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 99, 0, 0, 0, 0, 0, 0, 0, 0]));

    expect(sb.getUInt32()).be.equal(1);

    expect(sb.r).be.equal(4);
    expect(sb.w).be.equal(0);

    expect(sb.getUInt32()).be.equal(2);

    expect(sb.r).be.equal(8);
    expect(sb.w).be.equal(0);

    expect(sb.getUInt32()).be.equal(99);

    expect(sb.r).be.equal(12);
    expect(sb.w).be.equal(0);

  });

  it("should add ascii", () => {

    const sb = new SeqBuffer(null, 20);

    sb.addASCII("");

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(0);

    sb.addASCII("abc");

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(3);

    expect(sb.buffer.compare(Buffer.from([97, 98, 99, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).be.equal(0);

  });

  it("should get ascii", () => {

    const sb = new SeqBuffer(Buffer.from([97, 98, 99, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));

    expect(sb.getASCII(3)).be.equal("abc");

    expect(sb.r).be.equal(3);
    expect(sb.w).be.equal(0);
  });

  it("should add utf8", () => {

    const sb = new SeqBuffer(null, 20);

    sb.addUTF8("");

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(0);

    sb.addUTF8("i❤u");

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(5);

    expect(sb.buffer.compare(new Buffer([0x69, 0xe2, 0x9d, 0xa4, 0x75, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).be.equal(0);

  });

  it("should get utf8", () => {

    const sb = new SeqBuffer(new Buffer([0x69, 0xe2, 0x9d, 0xa4, 0x75, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));

    expect(sb.getUTF8(5)).be.equal("i❤u");

    expect(sb.r).be.equal(5);
    expect(sb.w).be.equal(0);
  });

  it("should work with fixed string", () => {

    const sb = new SeqBuffer(Buffer.from("abcdefghij"));

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(0);

    sb.addASCIIPad("pqs", 8);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(8);

    expect(sb.buffer.compare(new Buffer([0x70, 0x71, 0x73, 0, 0, 0, 0, 0, 0x69, 0x6a]))).be.equal(0);

    // Reset write pointer
    sb.w = 0;

    // Same with UTF8
    sb.addUTF8Pad("pqs", 8);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(8);

    expect(sb.buffer.compare(new Buffer([0x70, 0x71, 0x73, 0, 0, 0, 0, 0, 0x69, 0x6a]))).be.equal(0);
  });

  it("should add IPs", () => {

    const sb = new SeqBuffer(null, 20);
    sb.addIPs(["1.2.3.4", "8.8.8.8", "192.255.238.238"]);

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(12);

    expect(sb.buffer.compare(new Buffer([1, 2, 3, 4, 8, 8, 8, 8, 192, 255, 238, 238, 0, 0, 0, 0, 0, 0, 0, 0]))).be.equal(0);
  });

  it("should get IPs", () => {

    const sb = new SeqBuffer(new Buffer([1, 2, 3, 4, 8, 8, 8, 8, 192, 255, 238, 238, 0, 0, 0, 0, 0, 0, 0, 0]));

    expect(sb.getIPs(12).toString()).be.equal(["1.2.3.4", "8.8.8.8", "192.255.238.238"].toString());

    expect(sb.r).be.equal(12);
    expect(sb.w).be.equal(0);
  });

  it("should add Mac", () => {

    const sb = new SeqBuffer(null, 20);

    sb.addMac("1-2-3-4-5-6");

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(16);

    expect(sb.buffer.compare(new Buffer([1, 2, 3, 4, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).be.equal(0);

  });

  it("should add Mac with offsetted word", () => {

    const sb = new SeqBuffer(null, 20);

    sb.addUInt16(4);

    sb.addMac("1-2-3-4-5-6");

    expect(sb.r).be.equal(0);
    expect(sb.w).be.equal(18);

    expect(sb.buffer.compare(new Buffer([0, 4, 1, 2, 3, 4, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).be.equal(0);
  });

  it("should get Mac", () => {

    const sb = new SeqBuffer(new Buffer([1, 2, 3, 4, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));

    expect(sb.getMAC(1, 6)).be.equal("01-02-03-04-05-06");

    expect(sb.r).be.equal(16);
    expect(sb.w).be.equal(0);
  });

  it("should get Mac with offsetted byte", () => {

    const sb = new SeqBuffer(new Buffer([0, 0xff, 0xff, 0xff, 0xff, 0xce, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));

    sb.getUInt8();

    expect(sb.getMAC(1, 6)).be.equal("FF-FF-FF-FF-CE-FF");

    expect(sb.r).be.equal(17);
    expect(sb.w).be.equal(0);
  });

  it("should add mixed options - 1st", () => {

    const sb = new SeqBuffer(null, 30);

    sb.addOptions({
      1: "1.2.3.4",
      2: 99,
      3: "192.168.0.1",
      4: ["192.168.2.2", "66.55.44.33"],
    });

    expect(sb.buffer.compare(new Buffer([
      1, 4, 1, 2, 3, 4,
      2, 4, 0, 0, 0, 99,
      3, 4, 192, 168, 0, 1,
      4, 8, 192, 168, 2, 2, 66, 55, 44, 33,
      0, 0]))).be.equal(0);
  });

  it("should get mixed options - 1st", () => {

    const sb = new SeqBuffer(new Buffer([
      1, 4, 1, 2, 3, 4,
      2, 4, 0, 0, 0, 99,
      3, 4, 192, 168, 0, 1,
      4, 8, 192, 168, 2, 2, 66, 55, 44, 33,
      255, 0]));

    expect(sb.getOptions()).deep.equal({
      1: "1.2.3.4",
      2: 99,
      3: ["192.168.0.1"],
      4: ["192.168.2.2", "66.55.44.33"],
    });

    expect(sb.r).be.equal(29);
    expect(sb.w).be.equal(0);
  });

  it("should add mixed options - 2nd", () => {
    const sb = new SeqBuffer(null, 27);

    sb.addOptions({
      145: [1, 2, 3],
      80: false,
      56: "whoo",
      57: 96,
      12: "a",
      54: "192.168.2.2",
    });

    expect(sb.buffer.compare(new Buffer([
      12, 1, 97, 54, 4, 192, 168, 2, 2,
      56, 4, 119, 104, 111, 111,
      57, 2, 0, 96,
      80, 1, 0,
      145, 3, 1, 2, 3]))).be.equal(0);
  });

  it("should get mixed options - 2st", () => {

    const sb = new SeqBuffer(new Buffer([
      54, 4, 192, 168, 2, 2,
      56, 4, 119, 104, 111, 111,
      57, 2, 0, 96,
      145, 3, 1, 2, 3,
      255, 0]));

    expect(sb.getOptions()).deep.equal({
      145: [1, 2, 3],
      56: "whoo",
      57: 96,
      54: "192.168.2.2",
    });

    expect(sb.r).be.equal(22);
    expect(sb.w).be.equal(0);
  });

  it("should add UInt16s options", () => {

    const sb = new SeqBuffer(null, 10);

    sb.addOptions({
      25: [1, 2, 3],
    });

    expect(sb.buffer.compare(new Buffer([
      25, 6, 0, 1, 0, 2, 0, 3, 0, 0]))).be.equal(0);
  });

  it("should get UInt16s options", () => {

    const sb = new SeqBuffer(new Buffer([
      25, 6, 0, 1, 0, 2, 0, 3, 0, 0]));

    expect(sb.getOptions()).deep.equal({
      25: [1, 2, 3],
    });

    expect(sb.r).be.equal(10);
    expect(sb.w).be.equal(0);
  });

  it("should add nothing for empty options", () => {

    const sb = new SeqBuffer(new Buffer(20).fill(32));

    sb.addOptions({
      /* void */
    });

    expect(sb.buffer.compare(new Buffer(20).fill(32))).be.equal(0);
  });

  it("should get hex correctly", () => {

    const sb = new SeqBuffer(new Buffer([1, 2, 3, 4, 5, 6, 7, 8, 9]));

    expect(sb.getInt8()).be.equal(1);
    expect(sb.getInt8()).be.equal(2);
    expect(sb.getInt8()).be.equal(3);

    expect(sb.getHex(5)).be.equal("0405060708");

    expect(sb.getInt8()).be.equal(9);

  });

});
