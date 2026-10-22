import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthCard } from '../components/AuthCard';
import { HomeHeader } from '../components/HomeHeader';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { LoginInput } from '../components/LoginInput';
import { SelectInput } from '../components/SelectInput';
import { ChevronRightIcon } from '../assets/icons';
import { fontFamily, radius, welcomeColors } from '../theme';
import { AuthStackParamList } from '../navigation/types';
import { SERVICE_ITEM_CATEGORIES, SERVICE_ITEM_OPTIONS } from '../constants/serviceItemCategories';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { useBlockBackWhile } from '../hooks/useBlockBackWhile';
import { addJobChangeOrderItem, addMyJobChangeOrderItem } from '../services/changeOrderService';
import { ChangeOrderSummary } from '../types/changeOrder';
import { changeOrderKind } from '../utils/changeOrder';
import { MAX_CURRENCY_AMOUNT, parseCurrencyInput, sanitizeCurrencyInput } from '../utils/currencyInput';
import { formatCurrency } from '../utils/formatCurrency';

type Props = NativeStackScreenProps<AuthStackParamList, 'AddChangeOrderItem'>;

const DESCRIPTION_MAX_LENGTH = 255;
/** Room for MAX_CURRENCY_AMOUNT as typed: "99999999.99". */
const NUMBER_MAX_LENGTH = 11;

const INVALID_AMOUNT_MESSAGE = `greater than $0 and no more than ${formatCurrency(MAX_CURRENCY_AMOUNT, true)}`;

/** Like parseCurrencyInput, but 0 (and empty) is allowed: a markup can be nothing. */
function parseMarkupInput(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed || /^0*(\.0*)?$/.test(trimmed)) {
    return 0;
  }
  return parseCurrencyInput(trimmed);
}

/** The Product picklist on a "Job Change Order" line item. */
const PRODUCT_OPTIONS = ['Product', 'Service'];

interface FormProps {
  accountId: string | undefined;
  poId: string;
  changeOrder: ChangeOrderSummary;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  onDone: () => void;
  onCancel: () => void;
}

/** Runs a save: blocks the form meanwhile, goes back when done, shows any error. */
async function submit(props: FormProps, save: (accountId: string) => Promise<unknown>): Promise<void> {
  if (!props.accountId) {
    Alert.alert('Unable to save line item', 'Your account could not be found. Please log in again.');
    return;
  }
  props.setIsSaving(true);
  try {
    await save(props.accountId);
    // The change order screen reloads when it's shown again, so the new item appears there.
    props.onDone();
  } catch (error) {
    props.setIsSaving(false);
    Alert.alert('Unable to save line item', error instanceof Error ? error.message : 'Please try again.');
  }
}

/**
 * "+ Add Line Item" on a change order. The form depends on the change order's
 * source: a "Change Order" (from the job) takes a service item, category,
 * product, description, markup, cost and PO cost; a "My Change Order" a
 * description, quantity and unit price. Back on save.
 */
export function AddChangeOrderItemScreen({ navigation, route }: Props): React.JSX.Element {
  const { poId, changeOrder } = route.params;
  const accountId = useSubcontractorSession().company?.accountId;
  const [isSaving, setIsSaving] = useState(false);
  // Leaving mid-save would lose the result (and goBack would then pop the change order instead).
  useBlockBackWhile(isSaving);

  const formProps: FormProps = {
    accountId,
    poId,
    changeOrder,
    isSaving,
    setIsSaving,
    onDone: () => navigation.goBack(),
    onCancel: () => navigation.goBack(),
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <HomeHeader />
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            disabled={isSaving}
            hitSlop={10}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityState={{ disabled: isSaving }}
          >
            <ChevronRightIcon size={18} color={welcomeColors.textPrimary} />
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            Add Line Item
          </Text>
          <Text style={styles.subtitle}>{changeOrder.name}</Text>
        </View>

        <AuthCard>
          {changeOrderKind(changeOrder.source) === 'jobChangeOrder' ? (
            <JobChangeOrderItemForm {...formProps} />
          ) : (
            <MyChangeOrderItemForm {...formProps} />
          )}
        </AuthCard>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

/**
 * Service Item → Category → Product (each narrowed by the one before),
 * Description, Markup, Cost and PO Cost.
 */
function JobChangeOrderItemForm(props: FormProps): React.JSX.Element {
  const { poId, changeOrder, isSaving } = props;
  const [serviceItem, setServiceItem] = useState('');
  const [category, setCategory] = useState('');
  const [product, setProduct] = useState('');
  const [description, setDescription] = useState('');
  const [markupText, setMarkupText] = useState('');
  const [costText, setCostText] = useState('');
  const [poCostText, setPoCostText] = useState('');

  const categories = SERVICE_ITEM_CATEGORIES[serviceItem] ?? [];

  const handleSelectServiceItem = (value: string): void => {
    setServiceItem(value);
    // A category picked for the previous service item may not belong to the new one.
    if (!SERVICE_ITEM_CATEGORIES[value]?.includes(category)) {
      setCategory('');
    }
  };

  const handleSave = (): void => {
    if (isSaving) {
      return;
    }
    if (!serviceItem) {
      Alert.alert('Missing service item', 'Please select a service item.');
      return;
    }
    if (!category) {
      Alert.alert('Missing category', 'Please select a category.');
      return;
    }
    if (!product) {
      Alert.alert('Missing product', 'Please select a product.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please enter a description for this line item.');
      return;
    }
    const markup = parseMarkupInput(markupText);
    if (markup === null) {
      Alert.alert('Invalid markup', `Please enter a markup of 0 or more, up to ${formatCurrency(MAX_CURRENCY_AMOUNT, true)}.`);
      return;
    }
    const cost = parseCurrencyInput(costText);
    if (cost === null) {
      Alert.alert('Invalid cost', `Please enter a cost ${INVALID_AMOUNT_MESSAGE}.`);
      return;
    }
    const poCost = parseCurrencyInput(poCostText);
    if (poCost === null) {
      Alert.alert('Invalid PO cost', `Please enter a PO cost ${INVALID_AMOUNT_MESSAGE}.`);
      return;
    }
    if (cost + markup > MAX_CURRENCY_AMOUNT) {
      Alert.alert('Amount too large', `Cost plus markup can't be more than ${formatCurrency(MAX_CURRENCY_AMOUNT, true)}.`);
      return;
    }
    submit(props, (accountId) =>
      addJobChangeOrderItem(accountId, poId, changeOrder, {
        serviceItem,
        category,
        product,
        description,
        markup,
        cost,
        poCost,
      }),
    );
  };

  return (
    <>
      <SelectInput
        label="Service Item"
        required
        placeholder="Select service item"
        value={serviceItem}
        options={SERVICE_ITEM_OPTIONS}
        onSelect={handleSelectServiceItem}
        disabled={isSaving}
      />
      <SelectInput
        label="Category"
        required
        placeholder={serviceItem ? 'Select category' : 'Select a service item first'}
        value={category}
        options={categories}
        onSelect={setCategory}
        disabled={isSaving || !serviceItem}
      />
      <SelectInput
        label="Product"
        required
        placeholder="Select product"
        value={product}
        options={PRODUCT_OPTIONS}
        onSelect={setProduct}
        disabled={isSaving}
      />
      <LoginInput
        label="Description"
        required
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
        autoCapitalize="sentences"
        maxLength={DESCRIPTION_MAX_LENGTH}
        multiline
        editable={!isSaving}
      />
      <CurrencyInput label="Markup" placeholder="0.00" value={markupText} onChange={setMarkupText} editable={!isSaving} />
      <CurrencyInput label="Cost" required placeholder="0.00" value={costText} onChange={setCostText} editable={!isSaving} />
      <CurrencyInput
        label="PO Cost"
        required
        placeholder="0.00"
        value={poCostText}
        onChange={setPoCostText}
        editable={!isSaving}
      />
      <FormButtons isSaving={isSaving} onCancel={props.onCancel} onSave={handleSave} />
    </>
  );
}

/** Description, Item Cost and Item Price. */
function MyChangeOrderItemForm(props: FormProps): React.JSX.Element {
  const { poId, changeOrder, isSaving } = props;
  const [description, setDescription] = useState('');
  const [itemCostText, setItemCostText] = useState('');
  const [itemPriceText, setItemPriceText] = useState('');

  const handleSave = (): void => {
    if (isSaving) {
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please enter a description for this line item.');
      return;
    }
    const itemCost = parseCurrencyInput(itemCostText);
    if (itemCost === null) {
      Alert.alert('Invalid item cost', `Please enter an item cost ${INVALID_AMOUNT_MESSAGE}.`);
      return;
    }
    const itemPrice = parseCurrencyInput(itemPriceText);
    if (itemPrice === null) {
      Alert.alert('Invalid item price', `Please enter an item price ${INVALID_AMOUNT_MESSAGE}.`);
      return;
    }
    submit(props, (accountId) => addMyJobChangeOrderItem(accountId, poId, changeOrder, { description, itemCost, itemPrice }));
  };

  return (
    <>
      <LoginInput
        label="Description"
        required
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
        autoCapitalize="sentences"
        maxLength={DESCRIPTION_MAX_LENGTH}
        multiline
        editable={!isSaving}
      />
      <CurrencyInput
        label="Item Cost"
        required
        placeholder="0.00"
        value={itemCostText}
        onChange={setItemCostText}
        editable={!isSaving}
      />
      <CurrencyInput
        label="Item Price"
        required
        placeholder="0.00"
        value={itemPriceText}
        onChange={setItemPriceText}
        editable={!isSaving}
      />
      <FormButtons isSaving={isSaving} onCancel={props.onCancel} onSave={handleSave} />
    </>
  );
}

function FormButtons({
  isSaving,
  onCancel,
  onSave,
}: {
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}): React.JSX.Element {
  return (
    // collapsable={false}: see LoginInput.
    <View style={styles.buttons} collapsable={false}>
      <Pressable
        onPress={onCancel}
        disabled={isSaving}
        style={({ pressed }) => [styles.button, styles.cancelButton, (pressed || isSaving) && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isSaving }}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
      <Pressable
        onPress={onSave}
        disabled={isSaving}
        style={({ pressed }) => [styles.button, styles.saveButton, (pressed || isSaving) && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isSaving, busy: isSaving }}
      >
        <Text style={styles.saveText}>{isSaving ? 'Saving…' : 'Save'}</Text>
      </Pressable>
    </View>
  );
}

function CurrencyInput({
  label,
  required = false,
  placeholder,
  value,
  onChange,
  editable,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  editable: boolean;
}): React.JSX.Element {
  return (
    <LoginInput
      label={label}
      required={required}
      placeholder={placeholder}
      value={value}
      onChangeText={(text) => onChange(sanitizeCurrencyInput(text))}
      keyboardType="decimal-pad"
      leftIcon={<Text style={styles.currencySymbol}>$</Text>}
      maxLength={NUMBER_MAX_LENGTH}
      editable={editable}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: welcomeColors.background,
  },
  // Same page padding as the Home screen.
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // The chevron points right; turned around it's a back arrow.
  backButton: {
    transform: [{ rotate: '180deg' }],
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 18,
    color: welcomeColors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: welcomeColors.accent,
  },
  currencySymbol: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  // Same as Add Change Order's buttons.
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: welcomeColors.loginButton,
    backgroundColor: welcomeColors.cardBackground,
  },
  saveButton: {
    backgroundColor: welcomeColors.loginButton,
  },
  cancelText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.textPrimary,
  },
  saveText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 14,
    color: welcomeColors.cardBackground,
  },
  pressed: {
    opacity: 0.85,
  },
});
