//base on https://github.com/esterTion/unity-texture-toolkit/blob/master/UnityAeest.php
import utils from './utils';
const {Buffer,BufferReader}=utils
import Bundle from './bundle';
import etc from './etc';
const hex2bin=hex=>Buffer.from(hex,'hex')
const isset=v=>typeof v!=='undefined'
const empty=v=>!(v&&v.length)
class AssetFile{
  constructor(stream){
    this.stream=stream
    this.filePath
    this.fileName
    this.fileGen
    this.m_Version='2.5.0f5'
    this.platform=0x6000000
    this.platformStr=''
    this.baseDefinitions=false
    this.classIDs=[]
    this.ClassStructures={}
    this.preloadTable=new Map()
    this.buildType
    this.version
    this.sharedAssetsList=[]
    this.valid=false

    try {
      var tableSize=stream.readInt32()
      var dataEnd=stream.readInt32()
      this.fileGen=stream.readInt32()
      var dataOffset=stream.readInt32()
      if (this.fileGen >= 9) {
        var endian=stream.readByte()
        stream.readData(3)
      } else {
        stream.position=dataEnd - tableSize
        endian=stream.readByte()
      }
      if (this.fileGen >= 22) {
        tableSize=stream.readUint32()
        dataEnd=stream.readInt64()
        dataOffset=stream.readInt64()
        stream.readInt64()
      }
      if (endian===0/* "\0" */) {
        stream.littleEndian=true
      }

      if (this.fileGen >= 7) {
        this.m_Version=stream.readStringToNull()
      }
      if (this.fileGen >= 8) {
        this.platform=stream.readInt32()
      }
      if (this.fileGen >= 13) {
        this.baseDefinitions=stream.readByte()===1//"\x01"
      }

      this.platformStr=AssetFile.platforms[this.platform]||AssetFile.platforms['default']
      

      for (let i=0,baseCount=stream.readInt32(); i<baseCount; i++) {
        if (this.fileGen < 14) {
          throw new Error('fileGen < 14')
        } else {
          this.readSerializedType()
        }
      }
      /* {
        const t2d=this.ClassStructures[28]
        const member=t2d&&t2d.members[5]
        if(member&&member.name==="m_DownscaleFallback"){
          t2d.members.splice(6,0,{
            'level':member.level,
            'type':'int',
            'name':'!!stupid!!',
            'size':4,
            'flag':0
          })
        }
      } */
      if (this.fileGen >= 7 && this.fileGen < 14) {
        stream.position += 4
      }
      var assetCount=stream.readInt32()
      var assetIDfmt='%0'+String(assetCount).length+'d'
      for(var i=0; i<assetCount; i++) {
        if (this.fileGen >= 14) {
          stream.alignStream(4)
        }
        var asset=new AssetPreloadData()
        asset.m_PathID=this.fileGen<14 ? stream.readInt32() : stream.readInt64()
        asset.offset=this.fileGen<22 ? stream.readUint32() : stream.readInt64()
        asset.offset += dataOffset
        asset.size=stream.readInt32()
        if (this.fileGen > 15) {
          var index=stream.readInt32()
          asset.type1=this.classIDs[index][0]
          asset.type2=this.classIDs[index][1]
        } else {
          asset.type1=stream.readInt32()
          asset.type2=stream.readUint16()
          stream.position += 2
        }
        if (this.fileGen==15) {
          stream.readByte()
        }
        asset.typeString=AssetFile.classIDReference[asset.type2]||'Unknown Type '+asset.type2
        asset.uniqueID=i//sprintf(assetIDfmt, i)
        asset.fullSize=asset.size
        asset.sourceFile=this
        this.preloadTable.set(asset.m_PathID,asset)
        /*
        should not met this type
        if (asset.type2==141 && this.fileGen==6) {
          throw new Exception('old gen file')
        }*/
      }
      this.buildType=this.m_Version.replace(/\d/g,'').split('.')
      this.version=this.m_Version.replace(/\D/g,'.').split('.')
      if(this.version[0]==2&&this.version[1]==0&&this.version[2]==1&&this.version[3]==7){
        this.version.splice(0,4,2017)
      }

      if (this.fileGen >= 14) {
        var someCount=stream.readInt32()
        for (var i=0; i<someCount; i++) {
          stream.readInt32()
          stream.alignStream(4)
          stream.readInt64()
        }
      }

      var sharedFileCount=stream.readInt32()
      for (var i=0; i<sharedFileCount; i++) {
        var shared={}
        shared.name=stream.readStringToNull()
        stream.position += 20
        sharedFileName=stream.readStringToNull()
        shared.fileName=sharedFileName
        shared.index=i
        this.sharedAssetsList.push(shared)
      }
      this.valid=true
    }catch(e){this.error=e}
  }
  readSerializedType(){
    var stream=this.stream
    var classID=stream.readInt32()
    if (this.fileGen > 15) {
      stream.readData(1)
      if ((type=stream.readInt16()) >= 0) {
        type=-1 - type
      } else {
        var type=classID
      }
      this.classIDs.push([type, classID])
      if (classID==114) {
        stream.position += 16
      }
      classID=type
    } else if (classID < 0) {
      stream.position += 16
    }
    stream.position += 16
    if (this.baseDefinitions) {
      var nodeInfoSize=24
      if (this.fileGen >= 19) {
        nodeInfoSize += 8
      }
      var varCount=stream.readInt32()
      var stringSize=stream.readInt32()
      stream.position += varCount * nodeInfoSize
      var stringReader=new BufferReader(stringSize?stream.readData(stringSize):'')
      var className=''
      var classVar=[]
      stream.position -= varCount * nodeInfoSize + stringSize
      for (var i=0; i<varCount; i++) {
        stream.readInt16()
        var level=stream.readByte()
        stream.readBoolean()

        var varTypeIndex=stream.readInt16()
        if (stream.readInt16()==0) {
          stringReader.seek(varTypeIndex)
          var varTypeStr=stringReader.readStringToNull()
        } else {
          varTypeStr=isset(AssetFile.baseStrings[varTypeIndex]) ? AssetFile.baseStrings[varTypeIndex] : varTypeIndex
        }

        var varNameIndex=stream.readInt16()
        if (stream.readInt16()==0) {
          stringReader.seek(varNameIndex)
          var varNameStr=stringReader.readStringToNull()
        } else {
          varNameStr=isset(AssetFile.baseStrings[varNameIndex]) ? AssetFile.baseStrings[varNameIndex] : varTypeIndex
        }

        var size=stream.readInt32()
        var flag2=stream.readInt32() != 0
        var flag=stream.readInt32()
        if (this.fileGen >= 19) {
          var RefTypeHash=stream.ulonglong
        }
        if (!flag2) {
          className=varTypeStr + ' ' + varNameStr
        } else {
          classVar.push({
            'level':level -1,
            'type':varTypeStr,
            'name':varNameStr,
            'size':size,
            'flag':flag
          })
        }
      }
      stream.position += stringSize
      var aClass={
        'ID':classID,
        'text':className,
        'members':classVar
      }
      //aClass.SubItems.Add(classID.ToString())
      this.ClassStructures[classID]=aClass

      if (this.fileGen >= 21) {
        arrSize=stream.long
        stream.position += arrSize * 4
      }
    }
  }
}
AssetFile.platforms={
  [-2]:'Unity Package',
  4: 'OSX',
  5: 'PC',
  6: 'Web',
  7: 'Web streamed',
  9: 'iOS',
  10:'PS3',
  11:'Xbox 360',
  13:'Android',
  16:'Google NaCl',
  19:'CollabPreview',
  21:'WP8',
  25:'Linux',
  29:'Wii U',
  'default':'Unknown Platform'
}
AssetFile.baseStrings={
  0:"AABB",
  5:"AnimationClip",
  19:"AnimationCurve",
  34:"AnimationState",
  49:"Array",
  55:"Base",
  60:"BitField",
  69:"bitset",
  76:"bool",
  81:"char",
  86:"ColorRGBA",
  96:"Component",
  106:"data",
  111:"deque",
  117:"double",
  124:"dynamic_array",
  138:"FastPropertyName",
  155:"first",
  161:"float",
  167:"Font",
  172:"GameObject",
  183:"Generic Mono",
  196:"GradientNEW",
  208:"GUID",
  213:"GUIStyle",
  222:"int",
  226:"list",
  231:"long long",
  241:"map",
  245:"Matrix4x4f",
  256:"MdFour",
  263:"MonoBehaviour",
  277:"MonoScript",
  288:"m_ByteSize",
  299:"m_Curve",
  307:"m_EditorClassIdentifier",
  331:"m_EditorHideFlags",
  349:"m_Enabled",
  359:"m_ExtensionPtr",
  374:"m_GameObject",
  387:"m_Index",
  395:"m_IsArray",
  405:"m_IsStatic",
  416:"m_MetaFlag",
  427:"m_Name",
  434:"m_ObjectHideFlags",
  452:"m_PrefabInternal",
  469:"m_PrefabParentObject",
  490:"m_Script",
  499:"m_StaticEditorFlags",
  519:"m_Type",
  526:"m_Version",
  536:"Object",
  543:"pair",
  548:"PPtr<Component>",
  564:"PPtr<GameObject>",
  581:"PPtr<Material>",
  596:"PPtr<MonoBehaviour>",
  616:"PPtr<MonoScript>",
  633:"PPtr<Object>",
  646:"PPtr<Prefab>",
  659:"PPtr<Sprite>",
  672:"PPtr<TextAsset>",
  688:"PPtr<Texture>",
  702:"PPtr<Texture2D>",
  718:"PPtr<Transform>",
  734:"Prefab",
  741:"Quaternionf",
  753:"Rectf",
  759:"RectInt",
  767:"RectOffset",
  778:"second",
  785:"set",
  789:"short",
  795:"size",
  800:"SInt16",
  807:"SInt32",
  814:"SInt64",
  821:"SInt8",
  827:"staticvector",
  840:"string",
  847:"TextAsset",
  857:"TextMesh",
  866:"Texture",
  874:"Texture2D",
  884:"Transform",
  894:"TypelessData",
  907:"UInt16",
  914:"UInt32",
  921:"UInt64",
  928:"UInt8",
  934:"unsigned int",
  947:"unsigned long long",
  966:"unsigned short",
  981:"vector",
  988:"Vector2f",
  997:"Vector3f",
  1006:"Vector4f",
  1015:"m_ScriptingClassIdentifier",
  1042:"Gradient",
  1051:"Type*"
}
AssetFile.classIDReference={
  1:"GameObject",
  2:"Component",
  3:"LevelGameManager",
  4:"Transform",
  5:"TimeManager",
  6:"GlobalGameManager",
  8:"Behaviour",
  9:"GameManager",
  11:"AudioManager",
  12:"ParticleAnimator",
  13:"InputManager",
  15:"EllipsoidParticleEmitter",
  17:"Pipeline",
  18:"EditorExtension",
  19:"Physics2DSettings",
  20:"Camera",
  21:"Material",
  23:"MeshRenderer",
  25:"Renderer",
  26:"ParticleRenderer",
  27:"Texture",
  28:"Texture2D",
  29:"SceneSettings",
  30:"GraphicsSettings",
  33:"MeshFilter",
  41:"OcclusionPortal",
  43:"Mesh",
  45:"Skybox",
  47:"QualitySettings",
  48:"Shader",
  49:"TextAsset",
  50:"Rigidbody2D",
  51:"Physics2DManager",
  53:"Collider2D",
  54:"Rigidbody",
  55:"PhysicsManager",
  56:"Collider",
  57:"Joint",
  58:"CircleCollider2D",
  59:"HingeJoint",
  60:"PolygonCollider2D",
  61:"BoxCollider2D",
  62:"PhysicsMaterial2D",
  64:"MeshCollider",
  65:"BoxCollider",
  66:"SpriteCollider2D",
  68:"EdgeCollider2D",
  70:"CapsuleCollider2D",
  72:"ComputeShader",
  74:"AnimationClip",
  75:"ConstantForce",
  76:"WorldParticleCollider",
  78:"TagManager",
  81:"AudioListener",
  82:"AudioSource",
  83:"AudioClip",
  84:"RenderTexture",
  86:"CustomRenderTexture",
  87:"MeshParticleEmitter",
  88:"ParticleEmitter",
  89:"Cubemap",
  90:"Avatar",
  91:"AnimatorController",
  92:"GUILayer",
  93:"RuntimeAnimatorController",
  94:"ScriptMapper",
  95:"Animator",
  96:"TrailRenderer",
  98:"DelayedCallManager",
  102:"TextMesh",
  104:"RenderSettings",
  108:"Light",
  109:"CGProgram",
  110:"BaseAnimationTrack",
  111:"Animation",
  114:"MonoBehaviour",
  115:"MonoScript",
  116:"MonoManager",
  117:"Texture3D",
  118:"NewAnimationTrack",
  119:"Projector",
  120:"LineRenderer",
  121:"Flare",
  122:"Halo",
  123:"LensFlare",
  124:"FlareLayer",
  125:"HaloLayer",
  126:"NavMeshAreas",
  127:"HaloManager",
  128:"Font",
  129:"PlayerSettings",
  130:"NamedObject",
  131:"GUITexture",
  132:"GUIText",
  133:"GUIElement",
  134:"PhysicMaterial",
  135:"SphereCollider",
  136:"CapsuleCollider",
  137:"SkinnedMeshRenderer",
  138:"FixedJoint",
  140:"RaycastCollider",
  141:"BuildSettings",
  142:"AssetBundle",
  143:"CharacterController",
  144:"CharacterJoint",
  145:"SpringJoint",
  146:"WheelCollider",
  147:"ResourceManager",
  148:"NetworkView",
  149:"NetworkManager",
  150:"PreloadData",
  152:"MovieTexture",
  153:"ConfigurableJoint",
  154:"TerrainCollider",
  155:"MasterServerInterface",
  156:"TerrainData",
  157:"LightmapSettings",
  158:"WebCamTexture",
  159:"EditorSettings",
  160:"InteractiveCloth",
  161:"ClothRenderer",
  162:"EditorUserSettings",
  163:"SkinnedCloth",
  164:"AudioReverbFilter",
  165:"AudioHighPassFilter",
  166:"AudioChorusFilter",
  167:"AudioReverbZone",
  168:"AudioEchoFilter",
  169:"AudioLowPassFilter",
  170:"AudioDistortionFilter",
  171:"SparseTexture",
  180:"AudioBehaviour",
  181:"AudioFilter",
  182:"WindZone",
  183:"Cloth",
  184:"SubstanceArchive",
  185:"ProceduralMaterial",
  186:"ProceduralTexture",
  187:"Texture2DArray",
  188:"CubemapArray",
  191:"OffMeshLink",
  192:"OcclusionArea",
  193:"Tree",
  194:"NavMeshObsolete",
  195:"NavMeshAgent",
  196:"NavMeshSettings",
  197:"LightProbesLegacy",
  198:"ParticleSystem",
  199:"ParticleSystemRenderer",
  200:"ShaderVariantCollection",
  205:"LODGroup",
  206:"BlendTree",
  207:"Motion",
  208:"NavMeshObstacle",
  210:"TerrainInstance",
  212:"SpriteRenderer",
  213:"Sprite",
  214:"CachedSpriteAtlas",
  215:"ReflectionProbe",
  216:"ReflectionProbes",
  218:"Terrain",
  220:"LightProbeGroup",
  221:"AnimatorOverrideController",
  222:"CanvasRenderer",
  223:"Canvas",
  224:"RectTransform",
  225:"CanvasGroup",
  226:"BillboardAsset",
  227:"BillboardRenderer",
  228:"SpeedTreeWindAsset",
  229:"AnchoredJoint2D",
  230:"Joint2D",
  231:"SpringJoint2D",
  232:"DistanceJoint2D",
  233:"HingeJoint2D",
  234:"SliderJoint2D",
  235:"WheelJoint2D",
  236:"ClusterInputManager",
  237:"BaseVideoTexture",
  238:"NavMeshData",
  240:"AudioMixer",
  241:"AudioMixerController",
  243:"AudioMixerGroupController",
  244:"AudioMixerEffectController",
  245:"AudioMixerSnapshotController",
  246:"PhysicsUpdateBehaviour2D",
  247:"ConstantForce2D",
  248:"Effector2D",
  249:"AreaEffector2D",
  250:"PointEffector2D",
  251:"PlatformEffector2D",
  252:"SurfaceEffector2D",
  253:"BuoyancyEffector2D",
  254:"RelativeJoint2D",
  255:"FixedJoint2D",
  256:"FrictionJoint2D",
  257:"TargetJoint2D",
  258:"LightProbes",
  259:"LightProbeProxyVolume",
  271:"SampleClip",
  272:"AudioMixerSnapshot",
  273:"AudioMixerGroup",
  280:"NScreenBridge",
  290:"AssetBundleManifest",
  292:"UnityAdsManager",
  300:"RuntimeInitializeOnLoadManager",
  301:"CloudWebServicesManager",
  303:"UnityAnalyticsManager",
  304:"CrashReportManager",
  305:"PerformanceReportingManager",
  310:"UnityConnectSettings",
  319:"AvatarMask",
  328:"VideoPlayer",
  329:"VideoClip",
  363:"OcclusionCullingData",
  1001:"Prefab",
  1002:"EditorExtensionImpl",
  1003:"AssetImporter",
  1004:"AssetDatabase",
  1005:"Mesh3DSImporter",
  1006:"TextureImporter",
  1007:"ShaderImporter",
  1008:"ComputeShaderImporter",
  1011:"AvatarMask",
  1020:"AudioImporter",
  1026:"HierarchyState",
  1027:"GUIDSerializer",
  1028:"AssetMetaData",
  1029:"DefaultAsset",
  1030:"DefaultImporter",
  1031:"TextScriptImporter",
  1032:"SceneAsset",
  1034:"NativeFormatImporter",
  1035:"MonoImporter",
  1037:"AssetServerCache",
  1038:"LibraryAssetImporter",
  1040:"ModelImporter",
  1041:"FBXImporter",
  1042:"TrueTypeFontImporter",
  1044:"MovieImporter",
  1045:"EditorBuildSettings",
  1046:"DDSImporter",
  1048:"InspectorExpandedState",
  1049:"AnnotationManager",
  1050:"PluginImporter",
  1051:"EditorUserBuildSettings",
  1052:"PVRImporter",
  1053:"ASTCImporter",
  1054:"KTXImporter",
  1101:"AnimatorStateTransition",
  1102:"AnimatorState",
  1105:"HumanTemplate",
  1107:"AnimatorStateMachine",
  1108:"PreviewAssetType",
  1109:"AnimatorTransition",
  1110:"SpeedTreeImporter",
  1111:"AnimatorTransitionBase",
  1112:"SubstanceImporter",
  1113:"LightmapParameters",
  1120:"LightmapSnapshot",
  367388927:"SubDerived",
  334799969:"SiblingDerived",
  687078895:"SpriteAtlas",
  1091556383:"Derived",
  1480428607:"LowerResBlitTexture",
  1571458007:"RenderPassAttachment"
}

class AssetPreloadData{
  /* m_PathID
  offset
  size
  type1
  type2
  typeString
  fullSize
  infoText
  extension
  sourceFile
  uniqueID */
}

class Asset{
  constructor(preloadData){
    var sourceFile=preloadData.sourceFile
    var stream=sourceFile.stream
    stream.position=preloadData.offset
    if (sourceFile.platform==-2) {
      throw new Error('no support')
    }
  }
}
class Mesh extends Asset{
  constructor(preloadData){
    super(preloadData)
    var {sourceFile}=preloadData
    var {stream}=sourceFile
    var {members}=sourceFile.ClassStructures[43]
    var struct0=this.struct0=ClassStructHelper.DeserializeStruct(stream,members)
    var struct=this.struct=ClassStructHelper.OrganizeStruct(struct0)
    this.data=new Float32Array(new Uint8Array(struct.m_VertexData.m_DataSize).buffer)
  }
  *toObjx(){
    for(var [line] of (this.data.join(',')+',').matchAll(/(?:[^,]+,){5}/g)){
      line=line.split(',',5)
      yield `v ${line.slice(0,3).join(' ')}`
      yield `vt ${line.slice(3,5).join(' ')}`
    }
  }
  toObj(){
    return Array.from(this.toObjx()).join('\n')
  }
}
class Texture2D extends Asset{
  constructor(preloadData, readSwitch) {
    super(preloadData)
    this.dwFlags=4103
    this.dwCaps=4096
    this.mipMap=false
    var {sourceFile}=preloadData
    var {stream}=sourceFile
    
    var {members}=sourceFile.ClassStructures[28]
    var struct0=this.struct0=ClassStructHelper.DeserializeStruct(stream,members)
    var struct=this.struct=ClassStructHelper.OrganizeStruct(struct0)
    this.name=struct['m_Name']
    this.width=struct['m_Width']
    this.height=struct['m_Height']
    this.completeImageSize=struct['m_CompleteImageSize']
    this.textureFormat=struct['m_TextureFormat']
    this.imageCount=struct['m_ImageCount']
    this.textureDimension=struct['m_TextureDimension']
    if(struct['image data']!=null&&struct['image data'].length){
      this.imageData=struct['image data']
      this.imageDataSize=this.imageData.length
    }else if(struct['m_StreamData']!=null){
      this.offset=struct['m_StreamData']['offset']
      this.imageDataSize=struct['m_StreamData']['size']
      this.path=struct['m_StreamData']['path']
      if(readSwitch!=null){
        if(this.path){
          const path=this.path.replace(/archive:\/[^/]+\//,'')
          const buf=readSwitch.get(path)
          if(buf!=null){
            const reader=new BufferReader(Buffer.from(buf))
            reader.position=this.offset
            this.imageData=reader.readData(this.imageDataSize)
          }else{
            throw new Error('require resource not found: '+this.path)
          }
        }else{
          this.imageData=stream.readData(this.imageDataSize)
        }
      }
    }
    this.textureFormatStr=TextureFormatMap[this.textureFormat]
    switch(this.textureFormat){
      case TextureFormat.ASTC_RGBA_4x4:
      case TextureFormat.ASTC_RGB_5x5:
      case TextureFormat.ASTC_RGB_6x6:
      case TextureFormat.ASTC_RGB_8x8:
      case TextureFormat.ASTC_RGB_10x10:
      case TextureFormat.ASTC_RGB_12x12:
      case TextureFormat.ASTC_RGBA_4x4:
      case TextureFormat.ASTC_RGBA_5x5:
      case TextureFormat.ASTC_RGBA_6x6:
      case TextureFormat.ASTC_RGBA_8x8:
      case TextureFormat.ASTC_RGBA_10x10:
      case TextureFormat.ASTC_RGBA_12x12:
        this.outputMethod='astcenc'
        break
      case TextureFormat.RGBA32:
      case TextureFormat.ARGB32:
        this.outputMethod='bmp'
        this.bitDepth=32
        break
      case TextureFormat.RGB24:
        this.outputMethod='bmp'
        this.bitDepth=24
        break
      case TextureFormat.ETC2_RGBA8:
        this.outputMethod='etc2a8'
        this.bitDepth=32
        break
      /* case TextureFormat.RGBA4444:
      case TextureFormat.RGB565:
        this.outputMethod='bmp'
        this.bitDepth=16
        break */
      case TextureFormat.PVRTC_RGB4:
        this.outputMethod='pvr'
        break
      default:
        this.outputMethod='not implemented: '+this.textureFormat+' '+this.textureFormatStr
    }
  }
  swapRgbBmp(data,format=this.textureFormat){
    const REG_RGB24=/([\x00-\xff])([\x00-\xff])([\x00-\xff])/g
    const REG_RGB32=/([\x00-\xff])([\x00-\xff])([\x00-\xff])([\x00-\xff])/g
    data=data||this.imageData
    var reg,str
    if(format==TextureFormat.RGB24){
      reg=REG_RGB24,str="$3$2$1\xff"
    }else if(format==TextureFormat.RGBA32){
      reg=REG_RGB32,str='$3$2$1$4'
    }else if(format==TextureFormat.ARGB32){
      reg=REG_RGB32,str='$4$3$2$1'
    }
    if(reg&&str){
      data=Array.from(data,v=>String.fromCharCode(v)).join('')
      data=data.replace(reg,str)
      return Buffer.from(data,'ascii')
    }
    if(format==TextureFormat.RGB565){
      let len=data.length,out=Buffer.alloc(len*2,0xff)
      for(let i=0;i<len;i+=2){
        pxl=data[i]+data[i+1]*256
        r=(pxl & 0xf800) >> 8
        out[i*2+2]=r | ((r & 0xe0) >> 5)
        g=(pxl & 0x7e0) >> 3
        out[i*2+1]=g | ((g & 0xb0) >> 6)
        b=(pxl & 0x1f) << 3
        out[i*2  ]=b | ((b & 0xe0) >> 5)
      }
      return out
    }else if(format==TextureFormat.RGBA4444){
      let len=data.length,out=Buffer.alloc(len*2,0xff)
      for(let i=0;i<len;i+=2){
        pxl=data[i]+data[i+1]*256
        r=(pxl & 0xf000) >> 8
        out[i*2+2]=r | (r >> 4)
        g=(pxl &  0xf00) >> 8
        out[i*2+1]=g | (g >> 4)
        b=(pxl &   0xf0)
        out[i*2  ]=b | (b >> 4)
        a=(pxl &    0xf)
        out[i*2+3]=a | (a << 4)
      }
      return out
    }
    throw new Error(this.outputMethod+' not supported')
  }
  swapRgbPng(data,format=this.textureFormat){
    throw new Error(this.outputMethod+' not supported')
  }
  toBlob(){
    if(this.outputMethod==='astcenc'){
      return new Blob([
        hex2bin('13ABA15C'),
        Buffer.from({
          48 :"0404",
          49 :"0505",
          50 :"0606",
          51 :"0808",
          52 :"0a0a",
          53 :"0c0c",
          54 :"0404",
          55 :"0505",
          56 :"0606",
          57 :"0808",
          58 :"0a0a",
          59 :"0c0c",
        }[this.textureFormat]+"01",'hex'),
        substr(pack('V', this.width), 0, 3),
        substr(pack('V', this.height), 0, 3),
        hex2bin('010000'),
        this.imageData
      ],{type:'image/astc'})
    }else if(this.outputMethod==='bmp'){
      const pack=(i)=>{
        var buf=Buffer.allocUnsafe(4)
        buf.writeUInt32LE(i,0)
        return buf
      }
      const {width,height}=this
      return new Blob([
        Buffer.from('BM','ascii'),
        pack((this.imageData.length)*32/this.bitDepth+54),
        hex2bin('0000000036000000'),
        // DIB header
        hex2bin('28000000'),//header size
        pack(width),
        pack(height),
        hex2bin('0100'),//channel
        hex2bin('2000'),//bitdepth
        hex2bin('00000000'),//compression
        pack((this.imageData.length)*32/this.bitDepth),
        hex2bin('00000000000000000000000000000000'),
        //hoz resolution + ver resolution + color num + important color num
        swapRGB(this.textureFormat, this.imageData)
      ],{type:'image/bmp'})
    }else if (this.outputMethod==='pvr'){
      return new Blob([this.imageData],{type:'image/pvr'})
    }
    throw new Error(this.outputMethod+' not supported')
  }
  toImageData(){
    if(this.outputMethod==='bmp'){
      let data=this.imageData,format=this.textureFormat
      let w=this.width,h=this.height,r,g,b,a
      if(format==TextureFormat.RGBA32){
        r=0,g=1,b=2,a=3
      }else if(format==TextureFormat.ARGB32){
        a=0,r=1,g=2,b=3
      }
      if(g&&b){
        const outData=new ImageData(w,h),out=outData.data
        for(let i=0;i<h;i++){
          for(let j=0;j<w;j++){
            let left=i*w*4+j*4,right=(h-i-1)*w*4+j*4
            out[left+0]=data[right+r]
            out[left+1]=data[right+g]
            out[left+2]=data[right+b]
            out[left+3]=data[right+a]
          }
        }
        return outData
      }
    }else if(this.outputMethod==='etc2a8'){
      const w=this.width,h=this.height
      const imgData=new ImageData(w,h)
      etc.decode_etc2a8_reverse(this.imageData,imgData)
      return imgData
    }
    throw new Error(this.outputMethod+' not supported')
  }
  createCtx(width=this.width,height=this.height){
    if(Texture2D.hasOffscreenCanvas||typeof Texture2D.hasOffscreenCanvas==='undefined'){
      try{
        const c=new OffscreenCanvas(width,height)
        const ctx=c.getContext("2d")
        Texture2D.hasOffscreenCanvas=true
        return ctx
      }catch(e){
        Texture2D.hasOffscreenCanvas=false
      }
    }
    const c=document.createElement('canvas')
    c.width=width;c.height=height
    return c.getContext("2d")
  }
  toPNG(){
    const img=this.toImageData()
    const ctx=this.createCtx()
    ctx.putImageData(img,0,0)
    return new Promise(ok=>{
      ctx.canvas.toBlob(ok,'image/png')
    })
  }
}
class TextAsset extends Asset{
  constructor(preloadData,readSwitch){
    super(preloadData)
    var sourceFile=preloadData.sourceFile
    var stream=sourceFile.stream
    if (sourceFile.platform==-2) {
      stream.readUint32()
      throw new Error('platform -2')
    }
    this.name=stream.readAlignedString(stream.long)
    if (readSwitch) {
      this.data=stream.readData(stream.long)
    }
  }
}
const TextureFormatMap={
   1 :'Alpha8',
   2 :'ARGB4444',
   3 :'RGB24',
   4 :'RGBA32',
   5 :'ARGB32',
   7 :'RGB565',
   9 :'R16',
  10 :'DXT1',
  12 :'DXT5',
  13 :'RGBA4444',
  14 :'BGRA32',
  15 :'RHalf',
  16 :'RGHalf',
  17 :'RGBAHalf',
  18 :'RFloat',
  19 :'RGFloat',
  20 :'RGBAFloat',
  21 :'YUY2',
  22 :'RGB9e5Float',
  26 :'BC4',
  27 :'BC5',
  24 :'BC6H',
  25 :'BC7',
  28 :'DXT1Crunched',
  29 :'DXT5Crunched',
  30 :'PVRTC_RGB2',
  31 :'PVRTC_RGBA2',
  32 :'PVRTC_RGB4',
  33 :'PVRTC_RGBA4',
  34 :'ETC_RGB4',
  35 :'ATC_RGB4',
  36 :'ATC_RGBA8',
  41 :'EAC_R',
  42 :'EAC_R_SIGNED',
  43 :'EAC_RG',
  44 :'EAC_RG_SIGNED',
  45 :'ETC2_RGB',
  46 :'ETC2_RGBA1',
  47 :'ETC2_RGBA8',
  48 :'ASTC_RGB_4x4',
  49 :'ASTC_RGB_5x5',
  50 :'ASTC_RGB_6x6',
  51 :'ASTC_RGB_8x8',
  52 :'ASTC_RGB_10x10',
  53 :'ASTC_RGB_12x12',
  54 :'ASTC_RGBA_4x4',
  55 :'ASTC_RGBA_5x5',
  56 :'ASTC_RGBA_6x6',
  57 :'ASTC_RGBA_8x8',
  58 :'ASTC_RGBA_10x10',
  59 :'ASTC_RGBA_12x12',
  60 :'ETC_RGB4_3DS',
  61 :'ETC_RGBA8_3DS',
  62 :'RG16',
  63 :'R8',
  64 :'ETC_RGB4Crunched',
  65 :'ETC2_RGBA8Crunched'
}
const reverseMap=obj=>Object.fromEntries(Object.entries(obj).map(([k,v])=>[v,Number(k)]))
const TextureFormat=reverseMap(TextureFormatMap)
Object.assign(Texture2D,{
  etc,
  formatMap:TextureFormatMap,
  format:TextureFormat
})
const {round,pow,ceil,log10,abs}=Math
const ClassStructHelper={
  roundSigDigs(number,sigdigs){
    var ori=number
    var power=ori==0?0:ceil(log10(abs(number)))
    number*=pow(10, sigdigs-power)
    return round(number)*pow(10, power-sigdigs)
  },
  DeserializeStruct(stream, members) {
    var output=[]
    for (var i=0; i<members.length;i++){
      var member=members[i]
      var name=member['name']
      var type=member['type']
      var level=member['level']
      var align=(member['flag'] & 16384) != 0
      var value={
        'level' :level,
        'name' :name,
        'type' :type,
        'value' :null
      }
      if (isset(member['alignBefore'])) {
        stream.alignStream(4)
      }
      switch (type) {
        case 'SInt8': {
          value['value']=stream.readByte()
          if (value['value'] >= 128) value['value']=value['value'] - 256
          break
        }
        case 'UInt8': {
          value['value']=stream.readByte()
          break
        }
        case 'SInt16': case 'short': {
          value['value']=stream.short
          break
        }
        case 'UInt16': case 'unsigned short': {
          value['value']=stream.ushort
          break
        }
        case 'SInt32': case 'int': {
          value['value']=stream.readInt32()
          break
        }
        case 'UInt32': case 'unsigned int': case 'Type*': {
          value['value']=stream.readUint32()
          break
        }
        case 'SInt64': case 'long long': {
          value['value']=stream.readInt64()
          break
        }
        case 'UInt64': case 'unsigned long long': {
          value['value']=stream.readUint64()
          break
        }
        case 'float': {
          value['value']=stream.readFloat()//roundSigDigs(,7)
          break
        }
        case 'double': {
          value['value']=stream.readDouble()//roundSigDigs(,14)
          break
        }
        case 'bool': {
          value['value']=stream.readBoolean()
          break
        }
        case 'string': {
          value['value']=stream.readAlignedString(stream.readInt32()).toString()
          i += 3
          break
        }
        case 'Array': {
          align=false
          if ((members[i - 1]['flag'] & 16384) != 0) align=true
          value['size']=stream.readInt32()
          var arr=ClassStructHelper.ReadArray(members, level, i)
          var dataArr=[]
          for (var j=0; j<value['size']; j++) {
            dataArr.push(ClassStructHelper.DeserializeStruct(stream, arr))
          }
          i += arr.length + 1
          value['value']=dataArr
          break
        }
        case 'TypelessData': {
          var size2=stream.readInt32()
          value['value']=stream.readData(size2)
          i+=2
          break
        }
        default: {
          if (align) {
            align=false
            ClassStructHelper.SetAlignBefore(members, level, i + 1)
          }
        }
      }
      if(align){
        stream.alignStream(4)
      }
      output.push(value)
    }
    return output
  },
  ReadArray(members,level,index){
    var member2=[]
    for(var i=index+2;i<members.length;i++){
      var member3=members[i]
      if(member3['level'] <= level)return member2
      member2.push(member3)
    }
    return member2
  },
  SetAlignBefore(members,level,index){
    for(var i=index;i<members.length;i++){
      var member=members[i]
      if(member['level']<=level){
        member['alignBefore']=true
        return
      }
    }
  },
  OrganizeStruct(deserializedStruct, level=0) {
    var currentLevel={}
    var subLevels=[]
    var lastMember=[{}]
    
    for(var member of deserializedStruct) {
      if (member['level']==level) {
        if (!empty(subLevels)) {
          lastMember[0][lastMember[1]]=ClassStructHelper.OrganizeStruct(subLevels, level + 1)
          subLevels=[]
        }
        currentLevel[member['name']]=member['value']
        lastMember=[currentLevel, member['name']]
      } else if (member['level'] > level) {
        if (member['type']==='Array' && !isset(member['arrProcessed'])) {
          member['arrProcessed']=true
          var arrLevel=member['level']
          member['value']=member['value'].map(function (i){
            return ClassStructHelper.OrganizeStruct(i, arrLevel + 1)
          })
        }
        subLevels.push(member)
      }
    }
    if(!empty(subLevels)){
      lastMember[0][lastMember[1]]=ClassStructHelper.OrganizeStruct(subLevels, level + 1)
    }
    var keys=Object.keys(currentLevel)
    if(keys.length==1&&keys[0]=='Array'){
      currentLevel=currentLevel['Array']
    }
    return currentLevel
  }
}

export default Object.assign(Asset,{
  utils,
  Bundle:Bundle,
  File:AssetFile,
  PreloadData:AssetPreloadData,
  Mesh,
  Texture2D,
  TextAsset,
  ClassStructHelper
})