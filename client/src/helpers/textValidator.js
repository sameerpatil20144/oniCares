/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import React, { type ElementConfig } from 'react';
import { ValidatorComponent } from 'react-form-validator-core';
import {
    Form
} from 'react-bootstrap';
import Select, { components } from 'react-select';
import 'flatpickr/dist/themes/material_blue.css'
import Flatpickr from 'react-flatpickr'
import InputMask from "react-input-mask";

const DropdownIndicator = (
    props: ElementConfig<typeof components.DropdownIndicator>
) => {
    return (
        <components.DropdownIndicator {...props}>
            {props.selectProps.dropdownIcon}
        </components.DropdownIndicator>
    );
};


class TextValidator extends ValidatorComponent {

    render() {
        const { errorMessages, validatorListener, select2, flatpickr, defaultdate, parentClass = '', id, dropdownIcon, inputmask, selectedOption, ...rest } = this.props;

        const selectClass = this.props.as == 'select' ? ' type-select ' : '';

        const tableError = this.errorText() !== null ? ' table-error' : '';

        return (
            <div className={selectClass + parentClass + tableError} >
                {this.props.label && (
                    <Form.Label htmlFor={id && id} style={{ marginTop: '15px' }}>{this.props.label}</Form.Label>
                )}

                {select2 ?

                    <Select
                        getOptionLabel={option => option.name}
                        getOptionValue={option => option.id}
                        isClearable={true}
                        dropdownIcon={dropdownIcon || <i className="fas fa-caret-down"></i>}
                        components={{
                            DropdownIndicator,
                            IndicatorSeparator: () => null
                        }}
                        {...rest}
                        onChange={
                            (value) => {
                                if (value) {
                                    this.props.onChange({ target: { name: this.props.name, value: value.id, extra: value } })
                                } else {
                                    this.props.onChange({ target: { name: this.props.name, id: '' , extra: null } })
                                }
                            }
                        }
                        ref={(r) => { this.input = r; }}
                    />
                    : flatpickr ?
                        <Flatpickr
                            className="form-control mt-1"
                            value={selectedOption}
                            options={{
                                dateFormat: this.props.dateformat || "d-m-Y",
                                defaultDate: defaultdate,
                                enableTime: this.props.enabletime,
                                noCalendar: this.props.nocalendar,
                                minDate: this.props.mindate,
                                maxDate: this.props.maxdate,
                                time_24hr: true
                            }}
                            placeholder="dd-mm-yyyy"
                            {...rest}
                            onChange={
                                (date) =>
                                    date &&
                                    this.props.onChange({ target: { name: this.props.name, value: date } })
                            }
                            ref={(r) => { this.input = r; }}
                        />
                        : inputmask ?
                            <InputMask
                                className="form-control"
                                mask="99-99-9999"
                                {...rest}
                                ref={(r) => { this.input = r; }}
                            />
                            :
                            <Form.Control {...rest}
                                id={id}
                                ref={(r) => { this.input = r; }} />
                }

                <span>{this.props.postFix}</span>

                {this.props.type === "file" &&
                    (
                        <label className="custom-file-label" htmlFor={id}>
                            {this.props.value || 'Upload Attachment'}
                        </label>
                    )
                }

                <div className="error-text">{this.errorText()}</div>
            </div>
        );
    }

    errorText() {
        const { isValid } = this.state;

        if (isValid) {
            return null;
        }

        return (
            <div style={{ color: 'red' }}>
                {this.getErrorMessage()}
            </div>
        );
    }
}

export default TextValidator;