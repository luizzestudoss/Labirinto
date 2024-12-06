
class CameraHandler {
    constructor(zoom) {
        this.zoom = zoom
    }
    
    setZoom(newValue) {
        this.zoom = newValue
    }

    update(cameraX,cameraY) {
        translate(cameraX, cameraY);
        scale(this.zoom);
    }
}