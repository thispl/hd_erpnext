frappe.listview_settings['Expense Claim'] = {
	add_fields: ["approval_status", "total_claimed_amount", "docstatus"],
	filters: [["approval_status", "!=", "Rejected"]],
	get_indicator: function (doc) {
		if (doc.status == "Paid") {
			return [__("Paid"), "green", "status,=,'Paid'"];
		} else if (doc.status == "Unpaid") {
			return [__("Unpaid"), "orange"];
		} else if (doc.status == "Rejected") {
			return [__("Rejected"), "grey"];
		}
	},
	onload: function (listview) {
		if (!frappe.user.has_role("Expense Verifier")) {
			listview.page.hide_menu();
		}
		if (frappe.user.has_role("Expense Verifier")) {
			// if(listview.get_checked_items.length > 0){
			listview.page.add_menu_item(__("Mark Paid"), function () {
				frappe.prompt([
					{ 'fieldname': 'paid_date', 'fieldtype': 'Date', 'label': 'Paid Date', 'reqd': 1 }
				],
					function (values) {
						method = "hunter_douglas.utils.mark_exp_paid"
						listview.call_for_selected_items(method, { 'paid_date': values.paid_date });
					},
					'Select Paid Date',
					'Submit'
				)
			})

			// }


		}
	},
	refresh: function (me) {
		if (!frappe.user.has_role("Expense Verifier")) {
		me.page.hide_menu();
		}
		me.page.sidebar.find(".list-link[data-view='Kanban']").addClass("hide");
		me.page.sidebar.find(".list-link[data-view='Tree']").addClass("hide");
		me.page.sidebar.find(".assigned-to-me a").addClass("hide");
		if (!frappe.user.has_role('Expense Verifier')) {
			if (!frappe.user.has_role('Expense Approver')) {
				frappe.call({
					"method": "frappe.client.get_list",
					args: {
						doctype: "Employee",
						filters: { "user_id": frappe.session.user }
					},
					callback: function (r) {
						frappe.call({
							"method": "frappe.client.get",
							args: {
								doctype: "Employee",
								name: r.message[0].name
							},
							callback: function (r) {
								emp = r.message.employee;
								if (!frappe.route_options) {
									frappe.route_options = {
										"employee": ["=", emp]
									};
								}
							}
						})
					}
				})
			}
		}
	}
};
