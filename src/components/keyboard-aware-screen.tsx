import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
};

export function KeyboardAwareScreen({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
}: Props) {
  // iOS: KeyboardAvoidingView with padding.
  // Android: adjustResize in AndroidManifest handles it; no wrapper needed.
  // Web: browser handles focus scrolling natively; no wrapper needed.
  const useAvoidingView = Platform.OS === 'ios';

  const Container = useAvoidingView ? KeyboardAvoidingView : View;
  const containerProps = useAvoidingView
    ? { behavior: 'padding' as const, keyboardVerticalOffset }
    : {};

  return (
    <Container style={[styles.flex, style]} {...containerProps}>
      <ScrollView
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
});
