export function drawPen(ctx : CanvasRenderingContext2D, points : {x: number, y:number}[]){
    if(points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for(let i = 1; i<points.length; i++){
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
}