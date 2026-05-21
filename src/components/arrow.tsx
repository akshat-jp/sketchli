export function drawArrow(ctx : CanvasRenderingContext2D, x1 : number , y1 : number, x2 : number, y2 : number){
    
    const headLen = 15;
    const angle = Math.atan2(y2-y1, x2-x1); //angle of the line
    
    
    //the main line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    //left wing of the arrowhead
    ctx.beginPath();
    ctx.moveTo(x2,y2);
    ctx.lineTo(
        x2 - headLen * Math.cos(angle - Math.PI/6),
        y2 - headLen * Math.sin(angle - Math.PI/6),
    );
    ctx.stroke();

    //right wing of the arrowhead
    ctx.beginPath();
    ctx.moveTo(x2,y2);
    ctx.lineTo(
        x2 - headLen * Math.cos(angle + Math.PI/6),
        y2 - headLen * Math.sin(angle + Math.PI/6),
    );
    ctx.stroke();
}