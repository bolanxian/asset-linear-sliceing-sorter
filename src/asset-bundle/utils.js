
const {now}=Date,{min}=Math
const noop=()=>{}
const delay=t=>new Promise(ok=>{setTimeout(ok,t)})
const delay0_=ok=>{setTimeout(ok,0)}
const delay0=t=>new Promise(delay0_)
const timeIter=()=>{
  var prev=now(),cur,time
  return ()=>{
    cur=now()
    time=cur-prev
    prev=cur
    return time
  }
}

const generToFunc=(obj,key)=>{
  const generKey='x'+key
  Object.assign(obj,{
    [key](value,_){
      for(_ of this[generKey](value)){}
    },
    async [key+'Async'](value,onprogress){
      onprogress=onprogress||noop
      const time=timeIter()
      for(var stat of this[generKey](value)){//{i,size,name}
        stat.time=time()
        onprogress(stat)
        await delay0()
        time()
      }
    }
  })
}
const proxyHandle={
  get(target,name){
    if(name in target){return target[name]}
    else{return target.__get(name)}
  }
}

class Reader{
  constructor(){
    this.position=0
    this.size=0
    this.littleEndian=false
    return new Proxy(this,proxyHandle)
  }
  __get(name){
    console.warn(`Access ${name} of <${new Error().stack.split('\n',3)[2]}>`)
    switch(name) {
      case 'short': return this.readInt16()
      case 'ushort': return this.readUint16()
      case 'long': return this.readInt32()
      case 'ulong': return this.readUint32()
      case 'longlong': return this.readInt64()
      case 'ulonglong': return this.readUint64()
      case 'float': return this.readFloat()
      case 'double': return this.readDouble()
      case 'string': return this.readStringToNull()
      case 'line': return this.readStringToReturn()
      default:
    }
  }
  readStringToNull(){
    var s='',$char
    while(($char=this.read(1)[0])!=0){
      s+=String.fromCharCode($char)
    }
    return s
  }
  readStringAt(pos){
    var current=this.position
    this.position=pos
    var data=this.readStringToNull()
    this.position=current
    return data
  }
  readStringToReturn(){
    var s='',$char,$n='\n'.charCodeAt()
    while(this.position<this.size&&($char=this.read(1)[0])!=$n){
      s+=String.fromCharCode($char)
    }
    return s.trim()
  }
  readBoolean() {
    return this.read(1)[0]>0
  }
  readByte(){
    return this.read(1)[0]
  }
  readInt16(){
    var int=this.read(2)
    if (int.length!=2) return 0
    return int[this.littleEndian?'readInt16LE':'readInt16BE'](0)
  }
  readUint16(){
    var int=this.read(2)
    if (int.length!=2) return 0
    return int[this.littleEndian?'readUInt16LE':'readUInt16BE'](0)
  }
  readInt32(){
    var int=this.read(4)
    if (int.length!=4) return 0
    return int[this.littleEndian?'readInt32LE':'readInt32BE'](0)
  }
  readUint32(){
    var int=this.read(4)
    if (int.length!=4) return 0
    return int[this.littleEndian?'readUInt32LE':'readUInt32BE'](0)
  }
  readInt64(){
    var int=this.read(8)
    if (int.length!=8) return 0
    var view=new DataView(int.buffer,int.byteOffset)
    return view.getBigInt64(0,this.littleEndian)
  }
  readUint64(){
    var int=this.read(8)
    if (int.length!=8) return 0
    var view=new DataView(int.buffer,int.byteOffset)
    return view.getBigUint64(0,this.littleEndian)
  }
  readFloat(){
    var int=this.read(4)
    if(int.length!=4)return 0
    var view=new DataView(int.buffer,int.byteOffset)
    return view.getFloat32(0,this.littleEndian)
    //return int[this.littleEndian?'readFloatLE':'readFloatBE'](0)
  }
  readDouble(){
    var int=this.read(8)
    if(int.length!=8)return 0
    var view=new DataView(int.buffer,int.byteOffset)
    return view.getFloat64(0,this.littleEndian)
    //return int[this.littleEndian?'readDoubleLE':'readDoubleBE'](0)
  }
  readData(size){
    if(size<=0)return Buffer.allocUnsafe(0)
    return this.read(size)
  }
  readDataAt(pos,size){
    var current=this.position
    this.position=pos
    var data=this.readData(size)
    this.position=current
    return data
  }
  alignStream(alignment){
    var mod=this.position % alignment
    if (mod != 0) {
      this.position += alignment - mod
    }
  }
  readAlignedString(len){
    var string=this.readData(len)
    this.alignStream(4)
    return string
  }
}
class BufferReader extends Reader{
  constructor(data){
    super()
    if(!Buffer.isBuffer(data)){data=Buffer.from(data)}
    this.data=data
    this.position=0
    this.size=data.length
  }
  read(length){
    var data=this.data.slice(this.position,this.position+length)
    this.position+=length
    return data
  }
  seek(pos){
    this.position=pos
  }
  write(newData){
    this.data=Buffer.concat([this.data,Buffer.from(newData)])
    this.size+=newData.length
  }
}

export default ({
  noop,delay,delay0,
  timeIter,
  generToFunc,
  Buffer:Buffer,
  Reader,
  BufferReader
})