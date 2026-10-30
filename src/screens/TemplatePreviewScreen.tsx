import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ZoomablePdf } from '../components/ZoomablePdf';
import { ArrowLeftIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { getCertificateTemplatePath } from '../services/certificateTemplateService';

type Props = NativeStackScreenProps<AuthStackParamList, 'TemplatePreview'>;

/**
 * A registration PDF (the GL or WC template, or the agreement) full screen,
 * to pinch or double-tap zoom, with a back arrow top left.
 */
export function TemplatePreviewScreen({ navigation, route }: Props): React.JSX.Element {
  const { title } = route.params;
  const givenPath = 'path' in route.params ? route.params.path : null;
  const template = 'template' in route.params ? route.params.template : null;
  const [pdfPath, setPdfPath] = useState<string | null>(givenPath);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!template) {
      return;
    }
    let isMounted = true;
    getCertificateTemplatePath(template)
      .then((path) => {
        if (isMounted) {
          setPdfPath(path);
        }
      })
      .catch((error) => {
        console.error(`Failed to load ${title}:`, error);
        if (isMounted) {
          setHasError(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [template, title]);

  const handlePdfError = useCallback(
    (error: object) => {
      console.error(`Failed to render ${title} PDF:`, error);
      setHasError(true);
    },
    [title],
  );

  // A fixed (non-scrolling) layout, so the PDF viewer owns every scroll,
  // pinch and pan gesture instead of competing with a parent ScrollView.
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
            <ArrowLeftIcon size={18} color={welcomeColors.accent} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        </View>

        <View style={styles.pdfWrapper}>
          {hasError ? (
            <Text style={styles.errorText}>Unable to display this document. Please try again.</Text>
          ) : pdfPath ? (
            <ZoomablePdf path={pdfPath} style={styles.pdf} onError={handlePdfError} />
          ) : (
            <ActivityIndicator color={welcomeColors.accent} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: welcomeColors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 36,
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.accent,
  },
  pdfWrapper: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: welcomeColors.cardBorder,
    backgroundColor: welcomeColors.cardBackground,
    overflow: 'hidden',
  },
  pdf: {
    flex: 1,
    width: '100%',
    backgroundColor: welcomeColors.cardBackground,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    color: welcomeColors.textSecondary,
    textAlign: 'center',
    padding: 16,
  },
});
