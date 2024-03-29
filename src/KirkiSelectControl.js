/* global wp, jQuery, React, ReactDOM, _ */
import KirkiSelectForm from './KirkiSelectForm';

/**
 * KirkiSelectControl.
 *
 * @class
 * @augments wp.customize.Control
 * @augments wp.customize.Class
 */
const KirkiSelectControl = wp.customize.Control.extend({

	/**
	 * Initialize.
	 *
	 * @param {string} id - Control ID.
	 * @param {object} params - Control params.
	 */
	initialize: function( id, params ) {
		const control = this;

		// Bind functions to this control context for passing as React props.
		control.setNotificationContainer = control.setNotificationContainer.bind( control );

		wp.customize.Control.prototype.initialize.call( control, id, params );

		// The following should be eliminated with <https://core.trac.wordpress.org/ticket/31334>.
		function onRemoved( removedControl ) {
			if ( control === removedControl ) {
				control.destroy();
				control.container.remove();
				wp.customize.control.unbind( 'removed', onRemoved );
			}
		}
		wp.customize.control.bind( 'removed', onRemoved );
	},

	/**
	 * Set notification container and render.
	 *
	 * This is called when the React component is mounted.
	 *
	 * @param {Element} element - Notification container.
	 * @returns {void}
	 */
	setNotificationContainer: function setNotificationContainer( element ) {
		const control = this;
		control.notifications.container = jQuery( element );
		control.notifications.render();
	},

	/**
	 * Render the control into the DOM.
	 *
	 * This is called from the Control#embed() method in the parent class.
	 *
	 * @returns {void}
	 */
	renderContent: function renderContent() {
		const control = this;
		const value = control.setting.get();

		const form = <KirkiSelectForm
			{ ...control.params }
			value={ value }
			setNotificationContainer={ control.setNotificationContainer }
			customizerSetting={ control.setting }
			isOptionDisabled={ control.isOptionDisabled() }
			control={ control }
		/>;
		ReactDOM.render(
			form,
			control.container[0]
		);
	},

	/**
	 * After control has been first rendered, start re-rendering when setting changes.
	 *
	 * React is able to be used here instead of the wp.customize.Element abstraction.
	 *
	 * @returns {void}
	 */
	ready: function ready() {
		const control = this;

		// Re-render control when setting changes.
		control.setting.bind( () => {
			control.renderContent();
		} );
	},

	/**
	 * Handle removal/de-registration of the control.
	 *
	 * This is essentially the inverse of the Control#embed() method.
	 *
	 * @link https://core.trac.wordpress.org/ticket/31334
	 * @returns {void}
	 */
	destroy: function destroy() {
		const control = this;

		// Garbage collection: undo mounting that was done in the embed/renderContent method.
		ReactDOM.unmountComponentAtNode( control.container[0] );

		// Call destroy method in parent if it exists (as of #31334).
		if ( wp.customize.Control.prototype.destroy ) {
			wp.customize.Control.prototype.destroy.call( control );
		}
	},

	isOptionDisabled: function( option ) {
		if ( ! this.disabledSelectOptions ) {
			return false;
		}
		if ( this.disabledSelectOptions.indexOf( option ) ) {
			return true;
		}
		return false;
	},

	doSelectAction: function( action, arg ) {
		var control = this,
			i;

		switch ( action ) {

			case 'disableOption':
				this.disabledSelectOptions = 'undefined' === typeof this.disabledSelectOptions ? [] : this.disabledSelectOptions;
				this.disabledSelectOptions.push( this.getOptionProps( arg ) );
				break;

			case 'enableOption':
				if ( this.disabledSelectOptions ) {
					for ( i = 0; i < this.disabledSelectOptions.length; i++ ) {
						if ( this.disabledSelectOptions[ i ].value === arg ) {
							this.disabledSelectOptions.splice( i, 1 );
						}
					}
				}
				break;

			case 'selectOption':
				control.value = arg;
				break;
		}

		this.destroy();
		this.renderContent();
	},

	formatOptions: function() {
		var self = this;
		this.formattedOptions = [];
		_.each( self.params.choices, function( label, value ) {
			var optGroup;
			if ( 'object' === typeof label ) {
				optGroup = {
					label: label[0],
					options: []
				};
				_.each( label[1], function( optionVal, optionKey ) {
					optGroup.options.push( {
						label: optionVal,
						value: optionKey
					} );
				} );
				self.formattedOptions.push( optGroup );
			} else if ( 'string' === typeof label ) {
				self.formattedOptions.push( {
					label: label,
					value: value
				} );
			}
		});
	},

	getFormattedOptions: function() {
		if ( ! this.formattedOptions || ! this.formattedOptions.length ) {
			this.formatOptions();
		}
		return this.formattedOptions;
	},

	getOptionProps: function( value ) {
		var options = this.getFormattedOptions(), i, l;
		for ( i = 0; i < options.length; i++ ) {
			if ( options[ i ].value === value ) {
				return options[ i ];
			}

			if ( options[ i ].options ) {
				for ( l = 0; l < options[ i ].options.length; l++ ) {
					if ( options[ i ].options[ l ].value === value ) {
						return options[ i ].options[ l ];
					}
				}
			}
		}
	}
});

export default KirkiSelectControl;
