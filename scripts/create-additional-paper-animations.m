/*
 Original editorial animation artwork matching the existing paper covers.
 Build on macOS:
   clang -O2 -fobjc-arc -fno-modules -framework AppKit -framework ImageIO \
     scripts/create-additional-paper-animations.m -o /tmp/polyadic-paper-animations
   /tmp/polyadic-paper-animations .
 Checked-in GIF/PNG assets are used by the website; no build dependency is added.
 */
#import <AppKit/AppKit.h>
#import <ImageIO/ImageIO.h>
#include <math.h>

enum { W = 800, H = 640, FRAMES = 60, COLORS = 128 };
typedef struct { uint8_t r,g,b; } RGB;
static RGB palette[COLORS];
static uint8_t lookup[32768];
static const RGB BG={233,236,244}, INK={41,63,119}, BLUE={38,66,213},
    MUTED={82,99,138}, WHITE={249,250,252}, LINE={200,208,223},
    EDGE={151,168,209}, FILL={54,91,194}, LIGHT={206,216,255};
static CGContextRef ctx;

static RGB mix(RGB a,RGB b,double t) {
    return (RGB){lround(a.r+(b.r-a.r)*t),lround(a.g+(b.g-a.g)*t),lround(a.b+(b.b-a.b)*t)};
}
static NSColor *nscolor(RGB c) {return [NSColor colorWithSRGBRed:c.r/255. green:c.g/255. blue:c.b/255. alpha:1];}
static void fill(RGB c) {CGContextSetRGBFillColor(ctx,c.r/255.,c.g/255.,c.b/255.,1);}
static void stroke(RGB c) {CGContextSetRGBStrokeColor(ctx,c.r/255.,c.g/255.,c.b/255.,1);}
static double pulse(double t,double phase) {
    double d=fabs(t-phase);d=fmin(d,1-d);
    double x=fmax(0,1-d/.17);return x*x*(3-2*x);
}
static NSFont *font(NSString *kind,double size) {
    NSString *name=[kind isEqual:@"serif"]?@"Georgia":[kind isEqual:@"mono"]?@"Menlo-Regular":@"Helvetica";
    return [NSFont fontWithName:name size:size];
}
static double fit(NSString *s,NSString *kind,double size,double width) {
    while(size>10 && [s sizeWithAttributes:@{NSFontAttributeName:font(kind,size)}].width>width)size-=.5;
    return size;
}
static void text(NSString *s,double x,double y,NSString *kind,double size,RGB color,BOOL centered) {
    NSDictionary *attrs=@{NSFontAttributeName:font(kind,size),NSForegroundColorAttributeName:nscolor(color)};
    if(centered)x-=[s sizeWithAttributes:attrs].width/2;
    [s drawAtPoint:NSMakePoint(x,y) withAttributes:attrs];
}
static void rule(double x1,double y1,double x2,double y2,RGB color,double width) {
    stroke(color);CGContextSetLineWidth(ctx,width);
    CGContextMoveToPoint(ctx,x1,y1);CGContextAddLineToPoint(ctx,x2,y2);CGContextStrokePath(ctx);
}
static void rectangle(double x,double y,double w,double h,RGB color,RGB border,double radius) {
    CGPathRef path=CGPathCreateWithRoundedRect(CGRectMake(x,y,w,h),radius,radius,NULL);
    fill(color);stroke(border);CGContextSetLineWidth(ctx,1.5);
    CGContextAddPath(ctx,path);CGContextDrawPath(ctx,kCGPathFillStroke);CGPathRelease(path);
}
static void box(double x,double y,double w,double h,NSString *label,NSString *detail,BOOL dark,double strength) {
    rectangle(x,y,w,h,dark?mix(FILL,BLUE,strength):mix(WHITE,LIGHT,strength),
              mix(EDGE,BLUE,strength),3);
    double size=fit(label,@"sans",detail.length?27:23,w-16);
    double height=[label sizeWithAttributes:@{NSFontAttributeName:font(@"sans",size)}].height;
    text(label,x+w/2,y+(detail.length?20:(h-height)/2),@"sans",size,dark?(RGB){255,255,255}:INK,YES);
    if(detail.length)text(detail,x+w/2,y+h-31,@"mono",fit(detail,@"mono",11,w-14),dark?(RGB){238,242,255}:MUTED,YES);
}
static void arrow(double start,double end,double y,double t,double phase) {
    rule(start,y,end,y,EDGE,1.5);rule(end-7,y-5,end,y,EDGE,1.5);rule(end-7,y+5,end,y,EDGE,1.5);
    double p=(t-phase)/.19;
    if(p>=0 && p<=1){double x=start+(end-start)*p;fill(BLUE);CGContextFillEllipseInRect(ctx,CGRectMake(x-3,y-3,6,6));}
}
static void tokens(double x,double y,double w,NSArray<NSString *> *names,double strength) {
    double gap=9,b=(w-gap*(names.count-1))/names.count;
    for(NSUInteger i=0;i<names.count;i++)box(x+i*(b+gap),y,b,49,names[i],@"",NO,strength);
}

static NSArray<NSDictionary *> *specs(void) {
    return @[
      @{@"id":@"tdm-r1-2026",@"title":@"TDM-R1",@"kicker":@"FEW-STEP DIFFUSION / REINFORCEMENT LEARNING",
        @"subtitle":@"Reinforce few-step models with non-differentiable reward",
        @"labels":@[@"BLACK-BOX REWARD",@"REWARD LEARNING",@"TDM GENERATOR"],
        @"left":@[@"Reward",@"non-differentiable"],@"middle":@[@"Fit surrogate",@"Trace rewards",@"Update generator"],
        @"right":@[@"TDM",@"few-step generator"],
        @"footer":@[@"Learn a surrogate for black-box rewards.",@"Assign signals along deterministic trajectories.",@"Reinforce a few-step image generator."]},
      @{@"id":@"reward-instruct-2025",@"title":@"Reward-Instruct",@"kicker":@"FEW-STEP GENERATION / REWARD OPTIMIZATION",
        @"subtitle":@"A reward-centric approach to fast image generation",
        @"labels":@[@"PRE-TRAINED MODEL",@"REWARD UPDATES",@"FEW-STEP MODEL"],
        @"left":@[@"Base DM",@"pre-trained model"],@"middle":@[@"Maximize reward",@"Regularize",@"Update parameters"],
        @"right":@[@"Generator",@"reward enhanced"],
        @"footer":@[@"Start from a pre-trained diffusion model.",@"Optimize regularized reward.",@"Train a few-step image generator."]},
      @{@"id":@"diff-instruct-2023",@"title":@"Diff-Instruct",@"kicker":@"DIFFUSION KNOWLEDGE TRANSFER",
        @"subtitle":@"Transfer knowledge from pre-trained diffusion models",
        @"labels":@[@"PRE-TRAINED DM",@"IKL TRANSFER",@"GENERATOR"],
        @"left":@[@"Teacher",@"frozen score model"],@"middle":@[@"Add noise",@"Match scores",@"Integral KL"],
        @"right":@[@"Student",@"trainable generator"],
        @"footer":@[@"Transfer knowledge without training data.",@"Match distributions along a diffusion process.",@"Instruct a differentiable generator."]},
      @{@"id":@"any-order-gpt-2025",@"title":@"Any-Order GPT",@"kicker":@"FORMULATION / ARCHITECTURE",
        @"subtitle":@"Decouple modeling formulation from network architecture",
        @"labels":@[@"FORMULATION",@"ARCHITECTURE",@"DECODING"],
        @"left":@[@"Any order",@"modeling choice"],@"middle":@[@"Decoder-only",@"Shared backbone",@"AR / Masked DM"],
        @"right":@[@"Parallel",@"token predictions"],
        @"footer":@[@"Treat generation order as a modeling choice.",@"Compare formulations with a shared architecture.",@"Study parallel decoding and compute tradeoffs."]},
      @{@"id":@"attention-sink-2026",@"title":@"Attention Sink",@"kicker":@"TRANSFORMER MECHANISMS",
        @"subtitle":@"Variance discrepancy, super neurons and dimension disparity",
        @"labels":@[@"VALUE AGGREGATION",@"FFN AMPLIFICATION",@"ATTENTION SINK"],
        @"left":@[@"Variance",@"position statistics"],@"middle":@[@"FFN layers",@"Super neurons",@"Dimension gap"],
        @"right":@[@"Sink",@"structural anchor"],
        @"footer":@[@"Value aggregation creates a variance gap.",@"FFN super neurons amplify it.",@"Head-wise RMSNorm stabilizes aggregation."]},
      @{@"id":@"breaking-ar-bottleneck-2025",@"title":@"Sampling Bottleneck",@"kicker":@"MASKED DIFFUSION / SAMPLING THEORY",
        @"subtitle":@"Provable acceleration via diffusion language models",
        @"labels":@[@"TOKEN DEPENDENCE",@"CONVERGENCE",@"PARALLEL SAMPLING"],
        @"left":@[@"Tokens",@"statistical coupling"],@"middle":@[@"Information",@"KL guarantees",@"Error vs. rounds"],
        @"right":@[@"Sample",@"parallel unmasking"],
        @"footer":@[@"Token dependence controls sampling error.",@"More rounds tighten the KL guarantee.",@"Parallel unmasking can use fewer rounds."]},
      @{@"id":@"confidence-decoding-2026",@"title":@"Confidence Decoding",@"kicker":@"MASKED DIFFUSION / ADAPTIVE DECODING",
        @"subtitle":@"Use confidence to adapt each parallel generation step",
        @"labels":@[@"PREDICTION",@"ENTROPY BUDGET",@"UNMASKING"],
        @"left":@[@"Predict",@"conditional logits"],@"middle":@[@"Entropy sum",@"Budget selection",@"Reveal tokens"],
        @"right":@[@"Decode",@"adaptive batch"],
        @"footer":@[@"Use low entropy to select confident tokens.",@"Adapt the number of tokens per iteration.",@"Relate sampling rounds to data entropy."]}
    ];
}

static void renderDiagram(NSDictionary *s,double t) {
    NSString *identifier=s[@"id"];
    NSArray *labels=s[@"labels"],*left=s[@"left"],*right=s[@"right"],*middle=s[@"middle"];
    double columns[]={46,316,588};
    for(int i=0;i<3;i++)text(labels[i],columns[i],217,@"mono",fit(labels[i],@"mono",14,166),MUTED,NO);
    box(46,253,166,103,left[0],left[1],YES,pulse(t,.14));
    for(int i=0;i<3;i++)box(316,253+i*37,166,28,middle[i],@"",YES,pulse(t,.40));
    box(588,253,166,103,right[0],right[1],NO,pulse(t,.69));
    arrow(225,302,304,t,.19);arrow(495,574,304,t,.45);

    if([identifier isEqual:@"tdm-r1-2026"]) {
        text(@"DETERMINISTIC GENERATION TRAJECTORY",46,394,@"mono",14,MUTED,NO);
        NSArray *states=@[@"z₃",@"z₂",@"z₁",@"image"];
        for(int i=0;i<4;i++){
            double x=46+i*188;box(x,428,144,49,states[i],@"",i==3,pulse(t,.62+i*.075));
            if(i<3)arrow(x+153,x+179,452,t,.62+i*.075);
        }
    } else if([identifier isEqual:@"reward-instruct-2025"]) {
        text(@"PARAMETERS",46,394,@"mono",14,MUTED,NO);
        text(@"REWARD-TILTED UPDATE",316,394,@"mono",fit(@"REWARD-TILTED UPDATE",@"mono",14,166),MUTED,NO);
        text(@"NEXT ITERATION",588,394,@"mono",14,MUTED,NO);
        box(46,428,166,49,@"θ₀",@"",NO,pulse(t,.64));
        box(316,428,166,49,@"Reward + prior",@"",YES,pulse(t,.77));
        box(588,428,166,49,@"θ₁",@"",NO,pulse(t,.89));
        arrow(225,302,452,t,.63);arrow(495,574,452,t,.79);
    } else if([identifier isEqual:@"diff-instruct-2023"]) {
        text(@"NOISE",46,394,@"mono",14,MUTED,NO);text(@"GENERATOR",316,394,@"mono",14,MUTED,NO);
        text(@"SAMPLE",588,394,@"mono",14,MUTED,NO);
        tokens(46,428,166,@[@"ε₁",@"ε₂",@"ε₃"],pulse(t,.64));
        box(316,428,166,49,@"Gθ(z)",@"",YES,pulse(t,.77));
        box(588,428,166,49,@"x",@"",NO,pulse(t,.89));
        arrow(225,302,452,t,.63);arrow(495,574,452,t,.79);
    } else if([identifier isEqual:@"any-order-gpt-2025"]) {
        text(@"GENERATION ORDER",46,394,@"mono",14,MUTED,NO);
        text(@"DECODER-ONLY",316,394,@"mono",14,MUTED,NO);text(@"JOINT PREDICTIONS",588,394,@"mono",14,MUTED,NO);
        tokens(46,428,166,@[@"x₃",@"x₁",@"x₂"],pulse(t,.64));
        box(316,428,166,49,@"GPT",@"",YES,pulse(t,.77));
        tokens(588,428,166,@[@"x₁",@"x₂",@"x₃"],pulse(t,.89));
        arrow(225,302,452,t,.63);arrow(495,574,452,t,.79);
    } else if([identifier isEqual:@"attention-sink-2026"]) {
        rectangle(46,253,166,103,WHITE,EDGE,3);
        double heights[]={65,29,24,21};
        for(int i=0;i<4;i++){
            double h=heights[i]+pulse(t,.14)*(i==0?8:2);
            rectangle(65+i*34,337-h,20,h,mix(LIGHT,FILL,pulse(t,.14)),EDGE,1);
        }
        rectangle(588,253,166,103,WHITE,EDGE,3);
        for(int row=0;row<3;row++)for(int col=0;col<4;col++)
            rectangle(605+col*34,266+row*26,28,20,mix(WHITE,col==0?BLUE:LIGHT,col==0?.45+.5*pulse(t,.69):.5),EDGE,1);
        text(@"INTERVENTIONS",46,394,@"mono",14,MUTED,NO);
        text(@"CAUSAL TESTS",316,394,@"mono",14,MUTED,NO);text(@"STABILIZATION",588,394,@"mono",14,MUTED,NO);
        box(46,428,166,49,@"Change masks",@"",NO,pulse(t,.64));
        box(316,428,166,49,@"Probe variance",@"",YES,pulse(t,.77));
        box(588,428,166,49,@"Head-wise RMSNorm",@"",NO,pulse(t,.89));
        arrow(225,302,452,t,.63);arrow(495,574,452,t,.79);
    } else if([identifier isEqual:@"breaking-ar-bottleneck-2025"]) {
        text(@"AR ORDER",46,409,@"mono",14,MUTED,NO);
        text(@"PARALLEL BATCH",46,462,@"mono",14,MUTED,NO);
        for(int i=0;i<4;i++){
            NSString *label=@[@"x₁",@"x₂",@"x₃",@"x₄"][i];
            double x=250+i*126;
            box(x,400,100,36,label,@"",NO,pulse(t,.12+i*.17));
            box(x,453,100,36,label,@"",NO,pulse(t,.76));
            if(i<3)arrow(x+105,x+119,418,t,.18+i*.17);
        }
    } else {
        text(@"REVEAL CONFIDENT TOKENS TOGETHER",46,394,@"mono",14,MUTED,NO);
        NSArray *labels=@[@"x₁",@"[mask]",@"x₃",@"x₄"];
        for(int i=0;i<4;i++){
            double x=46+i*188;
            double strength=i==1?0:pulse(t,.79);
            box(x,428,144,49,labels[i],@"",NO,strength);
            rule(x+9,487,x+135,487,LINE,3);
            rule(x+9,487,x+9+(i==1?22:112),487,mix(EDGE,BLUE,strength),3);
        }
    }
}

static CGImageRef render(NSDictionary *s,double t,int scale) {
    CGColorSpaceRef space=CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    ctx=CGBitmapContextCreate(NULL,W*scale,H*scale,8,0,space,kCGImageAlphaPremultipliedLast);
    CGColorSpaceRelease(space);
    CGContextTranslateCTM(ctx,0,H*scale);CGContextScaleCTM(ctx,scale,-scale);
    CGContextSetShouldAntialias(ctx,true);CGContextSetAllowsFontSmoothing(ctx,true);
    NSGraphicsContext *graphics=[NSGraphicsContext graphicsContextWithCGContext:ctx flipped:YES];
    [NSGraphicsContext saveGraphicsState];[NSGraphicsContext setCurrentContext:graphics];
    fill(BG);CGContextFillRect(ctx,CGRectMake(0,0,W,H));
    text(s[@"kicker"],46,40,@"mono",14,MUTED,NO);
    text(s[@"title"],42,73,@"serif",fit(s[@"title"],@"serif",80,712),INK,NO);
    text(s[@"subtitle"],46,175,@"sans",fit(s[@"subtitle"],@"sans",18,708),MUTED,NO);
    renderDiagram(s,t);
    rule(46,516,754,516,LINE,1);
    NSArray *footer=s[@"footer"];
    for(int i=0;i<3;i++)text(footer[i],46,540+i*28,@"mono",fit(footer[i],@"mono",16,708),MUTED,NO);
    [NSGraphicsContext restoreGraphicsState];
    CGImageRef result=CGBitmapContextCreateImage(ctx);CGContextRelease(ctx);ctx=NULL;
    return result;
}

static void writePNG(CGImageRef image,NSString *path) {
    CGImageDestinationRef d=CGImageDestinationCreateWithURL((__bridge CFURLRef)[NSURL fileURLWithPath:path],CFSTR("public.png"),1,NULL);
    NSCAssert(d,@"Cannot create PNG destination");CGImageDestinationAddImage(d,image,NULL);
    NSCAssert(CGImageDestinationFinalize(d),@"PNG encoding failed");CFRelease(d);
}

static void setupPalette(void) {
    RGB bases[]={BG,INK,BLUE,MUTED,WHITE,LINE,EDGE,FILL,LIGHT,{255,255,255},{163,175,202},{125,140,175}};
    memcpy(palette,bases,sizeof(bases));int n=12;
    struct {RGB a,b;int count;} ramps[]={{BG,INK,36},{WHITE,BLUE,32},{BG,MUTED,16},{WHITE,LIGHT,16},{EDGE,BLUE,16}};
    for(int r=0;r<5;r++)for(int i=1;i<=ramps[r].count;i++)palette[n++]=mix(ramps[r].a,ramps[r].b,(double)i/ramps[r].count);
    NSCAssert(n==COLORS,@"Palette size mismatch");
    for(int key=0;key<32768;key++){
        int r=((key>>10)&31)*8+4,g=((key>>5)&31)*8+4,b=(key&31)*8+4;
        int best=0,distance=INT_MAX;
        for(int i=0;i<COLORS;i++){
            int dr=r-palette[i].r,dg=g-palette[i].g,db=b-palette[i].b;
            int d=dr*dr+dg*dg+db*db;
            if(d<distance){best=i;distance=d;}
        }
        lookup[key]=best;
    }
}
static NSData *indexed(CGImageRef image) {
    CGColorSpaceRef space=CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    CGContextRef c=CGBitmapContextCreate(NULL,W,H,8,W*4,space,kCGImageAlphaPremultipliedLast);
    CGColorSpaceRelease(space);CGContextSetInterpolationQuality(c,kCGInterpolationHigh);
    CGContextDrawImage(c,CGRectMake(0,0,W,H),image);
    const uint8_t *rgba=CGBitmapContextGetData(c);
    NSMutableData *data=[NSMutableData dataWithLength:W*H];uint8_t *out=data.mutableBytes;
    for(int i=0;i<W*H;i++)out[i]=lookup[((rgba[i*4]>>3)<<10)|((rgba[i*4+1]>>3)<<5)|(rgba[i*4+2]>>3)];
    CGContextRelease(c);return data;
}

static void verifyFrame(CGImageRef image,NSData *expected) {
    CGColorSpaceRef space=CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    CGContextRef c=CGBitmapContextCreate(NULL,W,H,8,W*4,space,kCGImageAlphaPremultipliedLast);
    CGColorSpaceRelease(space);CGContextDrawImage(c,CGRectMake(0,0,W,H),image);
    const uint8_t *rgba=CGBitmapContextGetData(c),*indices=expected.bytes;
    for(int i=0;i<W*H;i++){
        RGB color=palette[indices[i]];
        NSCAssert(rgba[i*4]==color.r && rgba[i*4+1]==color.g && rgba[i*4+2]==color.b,@"GIF frame pixels do not match the rendered artwork");
    }
    CGContextRelease(c);
}

typedef struct {NSMutableData *bytes;uint32_t bits;int count;} BitWriter;
static void emit(BitWriter *writer,int code,int *width,int next) {
    writer->bits|=(uint32_t)code<<writer->count;writer->count+=*width;
    while(writer->count>=8){uint8_t b=writer->bits&255;[writer->bytes appendBytes:&b length:1];writer->bits>>=8;writer->count-=8;}
    if(next>=(1<<*width) && *width<12)(*width)++;
}
static NSData *lzw(const uint8_t *pixels,NSUInteger count) {
    uint32_t keys[8192]={0};uint16_t values[8192];
    int clear=128,end=129,next=130,width=8,prefix=pixels[0];
    BitWriter writer={[NSMutableData data],0,0};emit(&writer,clear,&width,next);
    for(NSUInteger i=1;i<count;i++){
        uint32_t key=((uint32_t)prefix<<8)|pixels[i],stored=key+1;
        uint32_t slot=(key*2654435761u)&8191;
        while(keys[slot] && keys[slot]!=stored)slot=(slot+1)&8191;
        if(keys[slot]){prefix=values[slot];continue;}
        emit(&writer,prefix,&width,next);
        if(next<4096){keys[slot]=stored;values[slot]=next++;}
        else{emit(&writer,clear,&width,next);memset(keys,0,sizeof(keys));next=130;width=8;}
        prefix=pixels[i];
    }
    emit(&writer,prefix,&width,next);emit(&writer,end,&width,next);
    if(writer.count){uint8_t b=writer.bits&255;[writer.bytes appendBytes:&b length:1];}
    return writer.bytes;
}
static void u16(NSMutableData *d,int v) {uint8_t b[]={v&255,(v>>8)&255};[d appendBytes:b length:2];}
static NSMutableData *gifHeader(void) {
    NSMutableData *d=[NSMutableData dataWithBytes:"GIF89a" length:6];
    u16(d,W);u16(d,H);uint8_t props[]={0xf6,0,0};[d appendBytes:props length:3];
    for(int i=0;i<COLORS;i++){uint8_t c[]={palette[i].r,palette[i].g,palette[i].b};[d appendBytes:c length:3];}
    uint8_t loop[]={0x21,0xff,0x0b,'N','E','T','S','C','A','P','E','2','.','0',3,1,0,0,0};
    [d appendBytes:loop length:sizeof(loop)];return d;
}
static void gifFrame(NSMutableData *gif,NSData *data,NSData *previous,int frame) {
    const uint8_t *pixels=data.bytes,*old=previous.bytes;
    int minX=W,minY=H,maxX=-1,maxY=-1;
    if(!old){minX=0;minY=0;maxX=W-1;maxY=H-1;}
    else for(int y=0;y<H;y++)for(int x=0;x<W;x++)if(pixels[y*W+x]!=old[y*W+x]){
        minX=MIN(minX,x);minY=MIN(minY,y);maxX=MAX(maxX,x);maxY=MAX(maxY,y);
    }
    if(maxX<0){minX=0;minY=0;maxX=0;maxY=0;}
    int w=maxX-minX+1,h=maxY-minY+1;
    uint8_t control[]={0x21,0xf9,4,4,(frame==0?35:10),0,0,0,0x2c};
    [gif appendBytes:control length:sizeof(control)];u16(gif,minX);u16(gif,minY);u16(gif,w);u16(gif,h);
    uint8_t imageProps[]={0,7};[gif appendBytes:imageProps length:2];
    NSMutableData *crop=[NSMutableData dataWithLength:w*h];uint8_t *target=crop.mutableBytes;
    for(int y=0;y<h;y++)memcpy(target+y*w,pixels+(y+minY)*W+minX,w);
    NSData *encoded=lzw(target,w*h);const uint8_t *bytes=encoded.bytes;
    for(NSUInteger i=0;i<encoded.length;i+=255){uint8_t length=MIN((NSUInteger)255,encoded.length-i);[gif appendBytes:&length length:1];[gif appendBytes:bytes+i length:length];}
    uint8_t zero=0;[gif appendBytes:&zero length:1];
}

int main(int argc,const char *argv[]) {
    @autoreleasepool {
        NSString *root=argc>1?[NSString stringWithUTF8String:argv[1]]:NSFileManager.defaultManager.currentDirectoryPath;
        NSString *out=[root stringByAppendingPathComponent:@"assets/papers"];
        BOOL postersOnly=argc>2 && !strcmp(argv[2],"--posters-only");
        setupPalette();
        for(NSDictionary *spec in specs()){
            @autoreleasepool {
                NSString *identifier=spec[@"id"];
                CGImageRef poster=render(spec,.69,2);
                writePNG(poster,[out stringByAppendingPathComponent:[identifier stringByAppendingString:@"-poster.png"]]);
                CGImageRelease(poster);
                if(postersOnly){printf("%s poster\n",identifier.UTF8String);continue;}
                NSMutableData *gif=gifHeader();NSData *previous=nil;
                NSMutableArray<NSData *> *expected=[NSMutableArray array];
                for(int i=0;i<FRAMES;i++){
                    @autoreleasepool {
                        CGImageRef image=render(spec,(double)i/FRAMES,2);
                        NSData *pixels=indexed(image);CGImageRelease(image);
                        gifFrame(gif,pixels,previous,i);previous=pixels;[expected addObject:pixels];
                    }
                }
                uint8_t trailer=0x3b;[gif appendBytes:&trailer length:1];
                NSString *path=[out stringByAppendingPathComponent:[identifier stringByAppendingString:@"-preview.gif"]];
                NSCAssert([gif writeToFile:path atomically:YES],@"GIF write failed");
                CGImageSourceRef source=CGImageSourceCreateWithURL((__bridge CFURLRef)[NSURL fileURLWithPath:path],NULL);
                NSCAssert(source && CGImageSourceGetCount(source)==FRAMES,@"GIF decoding failed");
                for(int i=0;i<FRAMES;i++){
                    CGImageRef frame=CGImageSourceCreateImageAtIndex(source,i,NULL);
                    NSCAssert(frame && CGImageGetWidth(frame)==W && CGImageGetHeight(frame)==H,@"Invalid GIF frame");
                    verifyFrame(frame,expected[i]);
                    CGImageRelease(frame);
                }
                CFRelease(source);
                printf("%s: %d frames, %.0f KB\n",identifier.UTF8String,FRAMES,gif.length/1024.);
                fflush(stdout);
            }
        }
    }
    return 0;
}
