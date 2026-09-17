import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, welcomeColors } from '../theme';

type RegistrationProgressProps = {
  totalSteps: number;
  currentStep: number;
};

export function RegistrationProgress({
  totalSteps,
  currentStep,
}: RegistrationProgressProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const active = step === currentStep;
        const isLast = step === totalSteps;
        return (
          <React.Fragment key={step}>
            <View style={[styles.circle, active && styles.circleActive]}>
              <Text style={[styles.stepText, active && styles.stepTextActive]}>{step}</Text>
            </View>
            {!isLast && <View style={styles.connector} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: welcomeColors.iconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: welcomeColors.loginButton,
  },
  connector: {
    width: 12,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: welcomeColors.chevron,
  },
  stepText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: welcomeColors.chevron,
  },
  stepTextActive: {
    color: welcomeColors.cardBackground,
  },
});
