export function createEngineStub(id) {
  return {
    id,
    enabled: false,
    init() {},
    resize() {},
    update() {},
    render() {},
    handleEvent() {},
    destroy() {},
  };
}
