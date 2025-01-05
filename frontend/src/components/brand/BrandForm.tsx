import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FormContainer,
  FormSection,
  FormField,
  Input,
  Textarea,
  Select,
  Button,
} from '../shared/Form';
import { useCreateBrand } from '../../hooks/useSpotify';
import { BrandProfile } from '../../types';

// Form validation schema
const brandFormSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  brandEssence: z.object({
    coreIdentity: z.string().min(1, 'Core identity is required'),
    heritage: z.string(),
    brandVoice: z.string().min(1, 'Brand voice is required'),
  }),
  aestheticPillars: z.object({
    visualLanguage: z.array(z.string()).min(1, 'At least one visual element is required'),
    emotionalAttributes: z.array(z.string()).min(1, 'At least one emotional attribute is required'),
    signatureElements: z.array(z.string()).min(1, 'At least one signature element is required'),
  }),
});

type BrandFormData = z.infer<typeof brandFormSchema>;

interface BrandFormProps {
  onSuccess?: (brand: BrandProfile) => void;
}

export const BrandForm: React.FC<BrandFormProps> = ({ onSuccess }) => {
  const { mutate: createBrand, isPending } = useCreateBrand();
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: '',
      description: '',
      brandEssence: {
        coreIdentity: '',
        heritage: '',
        brandVoice: '',
      },
      aestheticPillars: {
        visualLanguage: [''],
        emotionalAttributes: [''],
        signatureElements: [''],
      },
    },
  });

  const onSubmit = (data: BrandFormData) => {
    createBrand(
      {
        brand: data.name,
        description: data.description,
        brand_essence: {
          core_identity: data.brandEssence.coreIdentity,
          heritage: data.brandEssence.heritage,
          brand_voice: data.brandEssence.brandVoice,
        },
        aesthetic_pillars: {
          visual_language: data.aestheticPillars.visualLanguage,
          emotional_attributes: data.aestheticPillars.emotionalAttributes,
          signature_elements: data.aestheticPillars.signatureElements,
        },
      },
      {
        onSuccess: (brand) => {
          onSuccess?.(brand);
        },
      }
    );
  };

  return (
    <FormContainer onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
      <FormSection
        title="Basic Information"
        description="Enter the fundamental details about your brand"
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <FormField
              label="Brand Name"
              error={errors.name?.message}
              required
            >
              <Input {...field} placeholder="Enter brand name" />
            </FormField>
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <FormField
              label="Brand Description"
              error={errors.description?.message}
              required
            >
              <Textarea
                {...field}
                placeholder="Describe your brand's overall identity and mission"
              />
            </FormField>
          )}
        />
      </FormSection>

      <FormSection
        title="Brand Essence"
        description="Define the core elements that make your brand unique"
      >
        <Controller
          name="brandEssence.coreIdentity"
          control={control}
          render={({ field }) => (
            <FormField
              label="Core Identity"
              error={errors.brandEssence?.coreIdentity?.message}
              required
            >
              <Input
                {...field}
                placeholder="What defines your brand at its core?"
              />
            </FormField>
          )}
        />

        <Controller
          name="brandEssence.heritage"
          control={control}
          render={({ field }) => (
            <FormField
              label="Heritage"
              error={errors.brandEssence?.heritage?.message}
            >
              <Textarea
                {...field}
                placeholder="Describe your brand's history and heritage"
              />
            </FormField>
          )}
        />

        <Controller
          name="brandEssence.brandVoice"
          control={control}
          render={({ field }) => (
            <FormField
              label="Brand Voice"
              error={errors.brandEssence?.brandVoice?.message}
              required
            >
              <Input
                {...field}
                placeholder="How does your brand communicate?"
              />
            </FormField>
          )}
        />
      </FormSection>

      <div className="flex justify-end space-x-4 mt-8">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isPending}
        >
          Create Brand
        </Button>
      </div>
    </FormContainer>
  );
};