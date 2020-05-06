import * as React from 'react';
import { ViewStyle, View } from 'react-native';

import { InsetChangeNativeCallback } from './SafeArea.types';

interface NativeSafeAreaViewProps {
  children?: React.ReactNode;
  style: ViewStyle;
  onInsetsChange: InsetChangeNativeCallback;
}

const CSSTransitions: Record<string, string> = {
  WebkitTransition: 'webkitTransitionEnd',
  Transition: 'transitionEnd',
  MozTransition: 'transitionend',
  MSTransition: 'msTransitionEnd',
  OTransition: 'oTransitionEnd',
};

export default function NativeSafeAreaView({
  children,
  style,
  onInsetsChange,
}: NativeSafeAreaViewProps) {
  React.useEffect(() => {
    // Skip for SSR.
    if (typeof document === 'undefined') {
      return;
    }

    const element = createContextElement();
    document.body.appendChild(element);
    const onEnd = () => {
      const {
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
      } = window.getComputedStyle(element);

      const insets = {
        top: paddingTop ? parseInt(paddingTop, 10) : 0,
        bottom: paddingBottom ? parseInt(paddingBottom, 10) : 0,
        left: paddingLeft ? parseInt(paddingLeft, 10) : 0,
        right: paddingRight ? parseInt(paddingRight, 10) : 0,
      };
      // @ts-ignore: missing properties
      onInsetsChange({ nativeEvent: { insets } });
    };
    element.addEventListener(getSupportedTransitionEvent(), onEnd);
    onEnd();
    return () => {
      document.body.removeChild(element);
      element.removeEventListener(getSupportedTransitionEvent(), onEnd);
    };
  }, [onInsetsChange]);

  return <View style={style}>{children}</View>;
}

let _supportedTransitionEvent: string | null = null;
function getSupportedTransitionEvent(): string {
  if (_supportedTransitionEvent !== null) {
    return _supportedTransitionEvent;
  }
  const element = document.createElement('invalidtype');

  _supportedTransitionEvent = CSSTransitions.Transition;
  for (const key in CSSTransitions) {
    if (element.style[key as keyof CSSStyleDeclaration] !== undefined) {
      _supportedTransitionEvent = CSSTransitions[key];
      break;
    }
  }
  return _supportedTransitionEvent;
}

function getInset(side: "top"|"bottom"|"left"|"right"): string {
  switch (side) {
    case "top":
      return "36px";
    case "bottom":
      return "36px";
    case "left":
      return "128px";
    case "right":
      return "128px";
  }
}

function createContextElement(): HTMLElement {
  const element = document.createElement('div');
  const { style } = element;
  style.position = 'fixed';
  style.left = '0';
  style.top = '0';
  style.width = '0';
  style.height = '0';
  style.zIndex = '-1';
  style.overflow = 'hidden';
  style.visibility = 'hidden';
  // Bacon: Anything faster than this and the callback will be invoked too early with the wrong insets
  style.transitionDuration = '0.05s';
  style.transitionProperty = 'padding';
  style.transitionDelay = '0s';
  style.paddingTop = getInset('top');
  style.paddingBottom = getInset('bottom');
  style.paddingLeft = getInset('left');
  style.paddingRight = getInset('right');
  return element;
}
