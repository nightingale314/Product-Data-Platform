"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { CreateAttributeFormItems } from "./CreateAttributeFormItems";
import { createAttributeSchema } from "@/schemas/attribute/createAttribute";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateAttributeSchema } from "@/schemas/attribute/createAttribute";
import { FormProvider, useForm } from "react-hook-form";
import { AttributeType } from "@prisma/client";
import { createAttributeAction } from "@/actions/attributes/createAttributeAction";
import { ServerErrorCode } from "@/constants/common";
import { useState } from "react";
import { toast } from "sonner";

export function CreateAttributeModal() {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateAttributeSchema>({
    resolver: zodResolver(createAttributeSchema),
    defaultValues: {
      type: AttributeType.SHORT_TEXT,
      required: false,
      enrichmentEnabled: true,
    },
  });

  const handleCreateAttribute = async (input: CreateAttributeSchema) => {
    try {
      const response = await createAttributeAction(input);
      if (response.errorCode === ServerErrorCode.SUCCESS) {
        toast.success(`${input.name} created successfully`);
        setOpen(false);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusIcon />
          Create Attribute
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-y-auto max-h-[90vh]">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleCreateAttribute)}>
            <DialogHeader>
              <DialogTitle>Create New Attribute</DialogTitle>
              <DialogDescription>
                Create a new custom attribute
              </DialogDescription>
            </DialogHeader>
            <CreateAttributeFormItems />
            <DialogFooter>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                isLoading={form.formState.isSubmitting}
              >
                Create attribute
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
