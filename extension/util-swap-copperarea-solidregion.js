const extensionId = Object.entries(easyeda.extension.instances).filter(e => e[1].blobURLs && e[1].blobURLs['manifest.json'] == api('getRes',{file:'manifest.json'}))[0][1].id;
const instance = easyeda.extension.instances[extensionId];

instance.util_swap_copperarea_solidregion = () => {
  const getSelectedIds = () => api('getSelectedIds').split(',').filter(id => id)
    
  for (const id of getSelectedIds()) {
      const obj = api('getShape', {id})
      const isCopper = obj.hasOwnProperty('keepIsland')
      const isSolid = obj.hasOwnProperty('type') && obj.type === 'solid'
      if (isCopper === isSolid) continue

      const { pathStr, layerid, net, gId } = obj
  
      api('createShape', {
          shapeType: isSolid ? 'COPPERAREA' : 'SOLIDREGION',
          jsonCache: { pathStr, layerid, net }
      })
      
      api('delete', {
          ids: [gId]
      })
  }
}