export function assertHasStyle(element: HTMLElement,
                               prop: string,
                               style: string|boolean,
                               not: boolean = false): boolean {
  var status, actualStyle = element.style.getPropertyValue(prop);
  if (style === false) {
    status = (actualStyle || '').length == 0;
  } else {
    status = not ? actualStyle != style
                 : actualStyle == style;
  }

  if (!status && /animation|transition/.test(prop)) {
    var webkitStyle = element.style.getPropertyValue('-webkit-' + prop);
    if (style === false) {
      status = (webkitStyle || '').length == 0;
    } else {
      status = not ? webkitStyle != style
                   : webkitStyle == style;
    }
  }

  return status;
}

export function ASSERT_FUNCTION(a,b,not) {
  if (not) {
    expect(a).not.toEqual(b);
  } else {
    expect(a).toEqual(b);
  }
}
