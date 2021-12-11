swap_copperarea_solidregion = () => {
  let selections = api('getSelectedIds')
  
  if (selections.length) {
    selections = selections.split(',')
  } else {
    $.messager.error('Please select a shape')
    return
  }

  selections.forEach(id => {
    const obj = api('getShape', {id})
    if (obj.hasOwnProperty('pathStr') && !obj.hasOwnProperty('fontSize')) {
      const { pathStr, layerid, net } = obj
      const isCA = obj.hasOwnProperty('keepIsland')

      api('createShape', {
        shapeType: isCA ? 'SOLIDREGION' : 'COPPERAREA',
        jsonCache: {
          shape: 'POLYGON',
          pathStr, layerid, net,
          [isCA ? 'type' : 'fillStyle']: 'solid'
        }
      })
    
      api('delete', {ids: [id]})
    }
  })
}


